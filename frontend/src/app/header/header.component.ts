import { Component, OnInit, OnDestroy } from '@angular/core';
import { CartService } from '../services/cart.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  cartItemCount: number = 0;
  isLoggedIn: boolean = false;
  searchTerm: string = '';
  private logoutSubscription: Subscription | null = null;

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.cartService.cartItemsCount$.subscribe(count => {
      this.cartItemCount = count;
    });

    this.authService.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
    });

    this.logoutSubscription = this.authService.logoutEvent$.subscribe(() => {
      this.router.navigate(['/']);
    });
  }

  performSearch(searchInput: HTMLInputElement): void {
    if (this.searchTerm.trim()) {
      const searchValue = this.searchTerm;
      this.router.navigate(['/catalog']).then(() => {
        this.router.navigate(['/catalog'], { queryParams: { search: searchValue } });
        searchInput.blur();
      });
    }
  }

  handleLogout(): void {
    if (this.isLoggedIn) {
      this.authService.logout();
    } else {
      this.router.navigate(['/login']);
    }
  }

  ngOnDestroy(): void {
    if (this.logoutSubscription) {
      this.logoutSubscription.unsubscribe();
    }
  }
}
