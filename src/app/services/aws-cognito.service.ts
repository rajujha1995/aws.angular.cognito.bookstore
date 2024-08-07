import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import {
  CognitoUser,
  CognitoUserPool,
  CognitoUserSession,
} from 'amazon-cognito-identity-js';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AwsCognitoService {
  private userPool!: CognitoUserPool;

  constructor(private router: Router, private http: HttpClient) {
    this.userPool = new CognitoUserPool({
      UserPoolId: environment.cognito.userPoolId, // Your User Pool ID
      ClientId: environment.cognito.userPoolWebClientId, // Your Client ID
    });
  }

  getCurrentUser(): CognitoUser | null {
    return this.userPool.getCurrentUser();
  }

  exchangeAuthCodeForTokens(code: string): Observable<any> {
    const body = new HttpParams()
      .set('grant_type', environment.grant_type)
      .set('client_id', environment.cognito.userPoolWebClientId)
      .set('code', code)
      .set('redirect_uri', environment.redirect_uri);

    return this.http.post(environment.oauth2_token_url, body.toString(), {
      headers: {
        'Content-Type': environment.content_type,
      },
    });
  }

  refreshAuthToken(refreshToken: string): Observable<any> {
    const body = new HttpParams()
      .set('grant_type', 'refresh_token')
      .set('client_id', environment.cognito.userPoolWebClientId)
      .set('refresh_token', refreshToken);

    return this.http.post(environment.oauth2_token_url, body.toString(), {
      headers: {
        'Content-Type': environment.content_type,
      },
    });
  }

  getUserAttributes(cognitoUser: CognitoUser): Observable<any> {
    return new Observable((observer) => {
      cognitoUser.getUserAttributes((err: any, result: any) => {
        if (err) {
          observer.error(err);
        } else {
          observer.next(result);
          observer.complete();
        }
      });
    });
  }

  getSession(cognitoUser: CognitoUser): Promise<CognitoUserSession> {
    return new Promise((resolve, reject) => {
      cognitoUser.getSession(
        (
          err: any,
          session: CognitoUserSession | PromiseLike<CognitoUserSession>
        ) => {
          if (err) {
            reject(err);
          } else {
            resolve(session);
          }
        }
      );
    });
  }

  decodeToken(token: string): any {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  }

  globalSignOut(): Promise<void> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return Promise.reject(new Error('No user is currently logged in.'));
    }

    return new Promise((resolve, reject) => {
      currentUser.globalSignOut({
        onSuccess: (msg: any) => {
          console.log('globalSignOut onSuccess:', msg);
          resolve();
        },
        onFailure: (err: any) => {
          console.error('globalSignOut onFailure:', err);
          reject(err);
        },
      });
    });
  }
}
