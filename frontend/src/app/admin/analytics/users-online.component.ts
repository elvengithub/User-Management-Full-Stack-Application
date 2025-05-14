import { Component, OnInit, OnDestroy } from '@angular/core';
import { AccountService } from '../../_services';
import { first } from 'rxjs/operators';
import { Account } from '../../_models';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-users-online',
    templateUrl: 'users-online.component.html'
})
export class UsersOnlineComponent implements OnInit, OnDestroy {
    accounts: Account[] = [];
    loading = true;
    subscriptions: Subscription[] = [];
    currentPage = 1;
    itemsPerPage = 5;
    totalPages = 1;
    Math = Math; // Make Math available in template
    
    constructor(
        private accountService: AccountService
    ) {}
    
    ngOnInit() {
        this.loadAccounts();
    }
    
    ngOnDestroy() {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }
    
    private loadAccounts() {
        this.loading = true;
        const sub = this.accountService.getAll()
            .pipe(first())
            .subscribe({
                next: accounts => {
                    // Sort accounts by online status
                    this.accounts = accounts.sort((a, b) => {
                        if (a.isOnline && !b.isOnline) return -1;
                        if (!a.isOnline && b.isOnline) return 1;
                        return 0;
                    });
                    this.totalPages = Math.ceil(this.accounts.length / this.itemsPerPage);
                    this.loading = false;
                },
                error: error => {
                    console.error('Error loading accounts:', error);
                    this.loading = false;
                }
            });
        
        this.subscriptions.push(sub);
    }
    
    get paginatedAccounts() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        return this.accounts.slice(startIndex, startIndex + this.itemsPerPage);
    }
    
    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
        }
    }
    
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
        }
    }
    
    // Helper methods for the template
    getOnlineUsersCount(): number {
        return this.accounts.filter(a => a.isOnline).length;
    }
    
    getOfflineUsersCount(): number {
        return this.accounts.filter(a => !a.isOnline).length;
    }
    
    getTotalUsersCount(): number {
        return this.accounts.length;
    }
    
    isAdminRole(role: string): boolean {
        return role === 'Admin';
    }
    
    isUserRole(role: string): boolean {
        return role === 'User';
    }
} 