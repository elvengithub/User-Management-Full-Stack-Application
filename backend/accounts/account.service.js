const config = require('../config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require("crypto");
const { Op } = require('sequelize');
const sendEmail = require('../_helpers/send_email');
const db = require('../_helpers/db');
const Role = require('../_helpers/role');

// Determine environment
const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const envConfig = config[env];

// Log configuration
console.log(`Using ${env} environment for account service`);

module.exports = {
    authenticate,
    refreshToken,
    revokeToken,
    register,
    verifyEmail,
    forgotPassword,
    validateResetToken,
    resetPassword,
    getAll,
    getById,
    create,
    update,
    delete: _delete,
    getAllAccounts
};

async function authenticate({ email, password, ipAddress }) {
    const account = await db.Account.scope('withHash').findOne({ where: { email } });

    if (!account) {
        throw 'Email does not exist';
    }

    if (!account.isVerified) {
        throw 'Email not yet verified';
    }

    if (account.status !== 'Active') {
        throw 'Account is inactive.';
    }

    const isPasswordValid = await bcrypt.compare(password, account.passwordHash);
    if (!isPasswordValid) {
        throw 'Password is incorrect';
    }

    const jwtToken = generateJwtToken(account);
    const refreshToken = generateRefreshToken(account, ipAddress);

    await refreshToken.save();

    return {
        ...basicDetails(account),
        jwtToken,
        refreshToken: refreshToken.token
    };
}

async function refreshToken({ token, ipAddress }) {
    if (!token) {
        throw 'Refresh token is required';
    }

    try {
        const refreshToken = await getRefreshToken(token);
        const account = await refreshToken.getAccount();

        // Verify account is still active
        if (account.status !== 'Active') {
            throw 'Account is inactive';
        }

        const newRefreshToken = generateRefreshToken(account, ipAddress);
        refreshToken.revoked = Date.now();
        refreshToken.revokedByIp = ipAddress;
        refreshToken.replacedByToken = newRefreshToken.token;
        
        await refreshToken.save();
        await newRefreshToken.save();

        const jwtToken = generateJwtToken(account);

        return {
            ...basicDetails(account),
            jwtToken,
            refreshToken: newRefreshToken.token
        };
    } catch (error) {
        console.error('Refresh token error:', error);
        throw 'Invalid token';
    }
}

async function revokeToken({ token, ipAddress }) {
    const refreshToken = await getRefreshToken(token);
    
    refreshToken.revoked = Date.now();
    refreshToken.revokedByIp = ipAddress;
    await refreshToken.save();
}

async function register(params, origin) {
    if (await db.Account.findOne({ where: { email: params.email } })) {
        await sendAlreadyRegisteredEmail(params.email, origin);
        throw 'Email "' + params.email + '" is already registered';
    }

    const account = new db.Account(params);
    const isFirstAccount = (await db.Account.count()) === 0;
    account.role = isFirstAccount ? Role.Admin : Role.User;
    account.status = isFirstAccount ? 'Active' : 'Inactive';
    account.verificationToken = isFirstAccount ? null : randomTokenString();

    if (isFirstAccount) {
        account.verified = Date.now();
    }

    account.passwordHash = await hash(params.password);
    await account.save();

    try {
        if (!isFirstAccount) {
            await sendVerificationEmail(account, origin);
        }
    } catch (err) {
        console.error("Email sending failed:", err.message);
        throw 'Failed to send verification email';
    }

    return {
        message: isFirstAccount 
            ? 'Registration successful. You can now login.'
            : 'Registration successful, please check your email for verification instructions'
    };
}

async function verifyEmail({ token }) {
    const account = await db.Account.findOne({ where: { verificationToken: token } });
    if (!account) throw 'Verification failed';

    account.verified = Date.now();
    account.verificationToken = null;
    account.status = 'Active';
    await account.save();
}

async function forgotPassword({ email }, origin) {
    const account = await db.Account.findOne({ where: { email } });

    if (!account) return;

    account.resetToken = randomTokenString();
    account.resetTokenExpires = new Date(Date.now() + 24*60*60*1000);
    await account.save();

    await sendPasswordResetEmail(account, origin);
}

async function validateResetToken({ token }) {
    const account = await db.Account.findOne({
        where: {
            resetToken: token,
            resetTokenExpires: { [Op.gt]: Date.now() }
        }
    });

    if (!account) throw 'Invalid token';

    return account;
}

async function resetPassword({ token, password }) {
    const account = await validateResetToken({ token });

    account.passwordHash = await hash(password);
    account.passwordReset = Date.now();
    account.resetToken = null;
    account.resetTokenExpires = null;
    await account.save();
}

async function getAll() {
    const accounts = await db.Account.findAll();
    return accounts.map(x => basicDetails(x));
}

async function getAllAccounts() {
    return await db.Account.findAll();
}

async function getById(id) {
    const account = await getAccount(id);
    return basicDetails(account);
}

async function create(params) {
    if (await db.Account.findOne({ where: { email: params.email } })) {
        throw 'Email "' + params.email + '" is already registered';
    }

    const account = new db.Account(params);
    account.verified = Date.now();
    account.verificationToken = null;
    account.status = params.status || 'Active';
    account.role = params.role || Role.User;
    account.passwordHash = await hash(params.password);
    await account.save();
    return basicDetails(account);
}

async function update(id, params) {
    const account = await getAccount(id);
    if (params.email && account.email !== params.email && await db.Account.findOne({ where: { email: params.email } })) {
        throw 'Email "' + params.email + '" is already taken';
    }

    if (params.password) {
        params.passwordHash = await hash(params.password);
    }

    Object.assign(account, params);
    account.updated = Date.now();
    await account.save();
    return basicDetails(account);
}

async function _delete(id) {
    const account = await getAccount(id);
    await account.destroy();
}

async function getAccount(id) {
    const account = await db.Account.findByPk(id);
    if (!account) throw 'Account not found';
    return account;
}

async function getRefreshToken(token) {
    if (!token || token === 'undefined') {
        console.error('Invalid refresh token: token is undefined or null');
        throw 'Invalid refresh token: token is missing';
    }
    
    try {
        const refreshToken = await db.RefreshToken.findOne({ where: { token } });
        
        if (!refreshToken) {
            console.error(`No refresh token found in database for token: ${token.substring(0, 10)}...`);
            throw 'Invalid token: token not found';
        }
        
        if (!refreshToken.isActive) {
            console.error(`Refresh token is inactive or expired: ${token.substring(0, 10)}...`);
            throw 'Invalid token: token is inactive or expired';
        }
        
        return refreshToken;
    } catch (error) {
        console.error('Error retrieving refresh token:', error);
        throw 'Invalid token';
    }
}

async function hash(password) {
    return await bcrypt.hash(password, 10);
}

function generateJwtToken(account) {
    if (!envConfig.secret) {
        console.error('JWT secret is missing or undefined!');
        throw new Error('JWT secret configuration is missing');
    }
    
    return jwt.sign(
        {
            sub: account.id,
            id: account.id,
            role: account.role
        },
        envConfig.secret,
        { expiresIn: '15m' }
    );
}

function generateRefreshToken(account, ipAddress) {
    return new db.RefreshToken({
        accountId: account.id,
        token: randomTokenString(),
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdByIp: ipAddress
    });
}

function randomTokenString() {
    return crypto.randomBytes(40).toString('hex');
}

function basicDetails(account) {
    const { id, title, firstName, lastName, email, role, created, updated, status, isVerified } = account;
    return { id, title, firstName, lastName, email, role, created, updated, status, isVerified };
}

async function sendVerificationEmail(account, origin) {
    // Always use proper production URL if no origin provided
    const productionUrl = 'https://user-management-full-stack-application-zeta.vercel.app';
    const verifyUrl = `${origin || productionUrl}/account/verify-email?token=${account.verificationToken}`;
    
    const emailTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Verify Your Email Address</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #2c3e50;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
        }
        .content {
            padding: 30px;
            background-color: #f9f9f9;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #3498db;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #777;
            background-color: #f0f0f0;
            border-radius: 0 0 8px 8px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Welcome to Our Platform</h1>
    </div>
    <div class="content">
        <div class="logo">User Management System</div>
        <p>Hello ${account.firstName},</p>
        <p>Thank you for registering with us! To complete your registration, please verify your email address by clicking the button below:</p>
        
        <p style="text-align: center;">
            <a href="${verifyUrl}" class="button">Verify Email Address</a>
        </p>
        
        <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
        <p><a href="${verifyUrl}" style="word-break: break-all;">${verifyUrl}</a></p>
        
        <p>This verification link will expire in 24 hours.</p>
        
        <p>If you didn't create an account with us, please ignore this email or contact support if you have questions.</p>
        
        <p>Best regards,<br>The User Management Team</p>
    </div>
    <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>&copy; ${new Date().getFullYear()} User Management System. All rights reserved.</p>
    </div>
</body>
</html>
    `;

    await sendEmail({
        to: account.email,
        subject: 'Please Verify Your Email Address',
        html: emailTemplate
    });
}

async function sendAlreadyRegisteredEmail(email, origin) {
    // Always use proper production URL if no origin provided
    const productionUrl = 'https://user-management-full-stack-application-zeta.vercel.app';
    const resetUrl = `${origin || productionUrl}/account/forgot-password`;
    
    const emailTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Email Already Registered</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #e74c3c;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
        }
        .content {
            padding: 30px;
            background-color: #f9f9f9;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #3498db;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #777;
            background-color: #f0f0f0;
            border-radius: 0 0 8px 8px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Account Already Exists</h1>
    </div>
    <div class="content">
        <div class="logo">User Management System</div>
        <p>Hello,</p>
        <p>We received a request to register a new account using this email address (${email}). However, this email is already registered in our system.</p>
        
        <p>If you've forgotten your password, you can reset it using the link below:</p>
        
        <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
        </p>
        
        <p>If you didn't attempt to register, no further action is required. Your account security is not affected.</p>
        
        <p>For security reasons, we recommend:</p>
        <ul>
            <li>Using a strong, unique password</li>
            <li>Enabling two-factor authentication if available</li>
            <li>Regularly updating your password</li>
        </ul>
        
        <p>If you need any assistance, please contact our support team.</p>
        
        <p>Best regards,<br>The User Management Team</p>
    </div>
    <div class="footer">
        <p>This is an automated security message. Please do not reply to this email.</p>
        <p>&copy; ${new Date().getFullYear()} User Management System. All rights reserved.</p>
    </div>
</body>
</html>
    `;

    await sendEmail({
        to: email,
        subject: 'Email Address Already Registered',
        html: emailTemplate
    });
}

async function sendPasswordResetEmail(account, origin) {
    // Always use proper production URL if no origin provided
    const productionUrl = 'https://user-management-full-stack-application-zeta.vercel.app';
    const resetUrl = `${origin || productionUrl}/account/reset-password?token=${account.resetToken}`;
    
    const emailTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Password Reset Request</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #3498db;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
        }
        .content {
            padding: 30px;
            background-color: #f9f9f9;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #e74c3c;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #777;
            background-color: #f0f0f0;
            border-radius: 0 0 8px 8px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 20px;
        }
        .security-tip {
            background-color: #fff8e1;
            padding: 15px;
            border-left: 4px solid #ffc107;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Password Reset Request</h1>
    </div>
    <div class="content">
        <div class="logo">User Management System</div>
        <p>Hello ${account.firstName},</p>
        <p>We received a request to reset the password for your account (${account.email}).</p>
        
        <p>To reset your password, click the button below:</p>
        
        <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
        </p>
        
        <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
        
        <div class="security-tip">
            <h3 style="margin-top: 0;">Security Tips:</h3>
            <ul>
                <li>Never share your password with anyone</li>
                <li>Make sure your password is strong and unique</li>
                <li>Change your password regularly</li>
                <li>Be cautious of phishing attempts</li>
            </ul>
        </div>
        
        <p>This password reset link will expire in 24 hours.</p>
        
        <p>Best regards,<br>The User Management Team</p>
    </div>
    <div class="footer">
        <p>This is an automated security message. Please do not reply to this email.</p>
        <p>&copy; ${new Date().getFullYear()} User Management System. All rights reserved.</p>
    </div>
</body>
</html>
    `;

    await sendEmail({
        to: account.email,
        subject: 'Password Reset Request',
        html: emailTemplate
    });
}