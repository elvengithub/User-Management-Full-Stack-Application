import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { AccountService } from '../../app/_services';
import { Role } from '../_models';

@Injectable({ providedIn: 'root' })
export class AuthGuard {
    constructor(
        private router: Router,
        private accountService: AccountService
    ) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        const account = this.accountService.accountValue;
        if (account) {
            // Check if route is restricted by role
            if (route.data.roles && route.data.roles.length) {
                // Get required roles as string values
                const requiredRoles = route.data.roles.map((role: any) => 
                    typeof role === 'string' ? role : role.toString());
                
                // Log role info for debugging
                console.log('Route access check:');
                console.log('- URL:', state.url);
                console.log('- Required roles:', requiredRoles);
                console.log('- User role:', account.role);
                
                // Check if user has required role (string comparison)
                const hasRequiredRole = requiredRoles.includes(account.role);
                console.log('- Has required role:', hasRequiredRole);
                
                if (!hasRequiredRole) {
                    // Role not authorized so redirect to home page
                    console.warn('Access denied: Insufficient privileges');
                    this.router.navigate(['/']);
                    return false;
                }
            }

            // Authorized so return true
            return true;
        }

        // Not logged in so redirect to login page with the return url
        this.router.navigate(['/account/login'], { queryParams: { returnUrl: state.url } });
        return false;
    }
}
