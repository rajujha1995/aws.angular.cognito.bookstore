import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class HeaderComponent implements OnInit {
  username: string | null = null;
  isLoggedIn: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.isLoggedIn$.subscribe((isLoggedIn) => {
      this.isLoggedIn = isLoggedIn;
    });

    this.authService.username$.subscribe((username) => {
      this.username = username;
    });
  }

  Login() {
    this.clearAllStorage();
    window.location.href = `https://bookstoren01649102.auth.us-east-1.amazoncognito.com/login?client_id=2ri1tj57559n89jebur2d9h6j9&response_type=code&scope=email+openid&redirect_uri=${encodeURIComponent(
      environment.redirect_uri
    )}`;
  }

  Logout(): void {
    this.clearAllStorage();
    this.authService.logout();
    this.cdr.detectChanges();
  }

  private clearAllStorage(): void {
    localStorage.clear();
    sessionStorage.clear();
    this.clearCookies();
  }

  private clearCookies(): void {
    const cookies = document.cookie.split(';');

    for (const cookie of cookies) {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
    }
  }
}
