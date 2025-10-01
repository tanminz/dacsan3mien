import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'my-app';
  isLoggedIn: boolean = false;
  isAdminRoute: boolean = false;

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.authService.isLoggedIn$.subscribe(isLoggedIn => {
      this.isLoggedIn = isLoggedIn;
    });

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.isAdminRoute = event.url.startsWith('/admin');
      });
  }

  toggleLogin(): void {
    if (this.isLoggedIn) {
      this.authService.logout();
    } else {
      const email = 'user@example.com';
      const password = 'password_example';
      const rememberMe = true;
      this.authService.login(email, password, rememberMe);
    }
  }
}
