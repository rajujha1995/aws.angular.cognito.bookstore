import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AwsCognitoService } from '../services/aws-cognito.service';
import { HttpClientModule } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
})
export class HomeComponent implements OnInit, OnDestroy {
  private refreshSubscription: Subscription | null = null;
  userName: string | null = null;

  constructor(
    private cognitoService: AwsCognitoService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    const code = this.route.snapshot.queryParams['code'];
    if (code) {
      try {
        const tokens = await this.cognitoService
          .exchangeAuthCodeForTokens(code)
          .toPromise();
        const username = this.getUsernameFromToken(tokens.id_token);
        this.authService.login(tokens, username);
        console.log('Tokens:', tokens);
        this.getUserDetailsFromCognito();
        this.startTokenRefreshTimer();
      } catch (error) {
        console.error('Error exchanging auth code for tokens:', error);
      }
    } else {
      this.startTokenRefreshTimer();
    }
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  getUsernameFromToken(idToken: string): string {
    const decodedToken = this.cognitoService.decodeToken(idToken);
    console.log('Decoded Token:', decodedToken);
    return decodedToken['email'];
  }

  async getUserDetailsFromCognito() {
    const cognitoUser = this.cognitoService.getCurrentUser();
    if (cognitoUser) {
      try {
        const attributes = await this.cognitoService
          .getUserAttributes(cognitoUser)
          .toPromise();
        const email =
          attributes.find((attr: any) => attr.Name === 'email')?.Value || '';
        const name =
          attributes.find((attr: any) => attr.Name === 'name')?.Value || '';
        console.log('User email:', email);
        console.log('User full name:', name);
      } catch (error) {
        console.error('Error getting user attributes:', error);
      }
    }
  }

  storeTokens(tokens: any) {
    sessionStorage.setItem('accessToken', tokens.access_token);
    sessionStorage.setItem('idToken', tokens.id_token);
    sessionStorage.setItem('refreshToken', tokens.refresh_token);
  }

  async getUserDetails() {
    const idToken = sessionStorage.getItem('idToken');

    if (idToken) {
      const decodedToken = this.cognitoService.decodeToken(idToken);
      this.userName = decodedToken['email'];
      if (this.userName) {
        sessionStorage.setItem('username', this.userName);
      }
      console.log('User name:', this.userName);
    } else {
      console.warn('ID token is missing in session storage.');
    }
  }

  startTokenRefreshTimer() {
    const refreshToken = sessionStorage.getItem('refreshToken');
    if (refreshToken) {
      this.refreshSubscription = interval(1000 * 60 * 55).subscribe(() => {
        this.cognitoService.refreshAuthToken(refreshToken).subscribe(
          (tokens) => {
            const username = this.getUsernameFromToken(tokens.id_token);
            this.authService.login(tokens, username);
            console.log('Refreshed Tokens:', tokens);
          },
          (error) => {
            console.error('Error refreshing tokens:', error);
            this.authService.logout();
          }
        );
      });
    }
  }
}
