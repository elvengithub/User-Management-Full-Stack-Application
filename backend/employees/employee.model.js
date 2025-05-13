const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        employeeId: { type: DataTypes.STRING, allowNull: false },
        firstName: { type: DataTypes.STRING, allowNull: false },
        lastName: { type: DataTypes.STRING, allowNull: false },
        email: { type: DataTypes.STRING, allowNull: false },
        departmentId: { type: DataTypes.INTEGER, allowNull: false },
        accountId: { type: DataTypes.INTEGER, allowNull: true },
        position: { type: DataTypes.STRING },
        hireDate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        phone: { type: DataTypes.STRING },
        status: { type: DataTypes.ENUM('Active', 'Inactive'), allowNull: false, defaultValue: 'Active' },
        created: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated: { type: DataTypes.DATE }
    };

    const options = {
        timestamps: false,
        hooks: {
            beforeUpdate: async (employee) => {
                employee.updated = new Date();
            }
        }
    };

    return sequelize.define('employee', attributes, options);
} 