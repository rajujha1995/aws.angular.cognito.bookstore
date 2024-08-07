import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {
  catchError,
  interval,
  map,
  Observable,
  of,
  Subscription,
  switchMap,
  tap,
} from 'rxjs';
import { Book } from '../../_models/book.model';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AwsCognitoService } from '../services/aws-cognito.service';
import { environment } from '../../environments/environment';
import { HandleImage } from '../../_models/handleimage.model';
import { response } from 'express';

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.css',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, ReactiveFormsModule],
})
export class BlogComponent implements OnInit {
  readonly apiUrl: string = environment.book_apiUrl;
  books$: Observable<Book[]> | null = null;
  errorMessage: string | null = null;
  private refreshSubscription: Subscription | null = null;
  imageSrc: string | ArrayBuffer | null = null;
  imageFile: File | null = null;

  booksForm = new FormGroup({
    id: new FormControl({ value: 0, disabled: true }, [Validators.required]),
    name: new FormControl('', [Validators.required]),
    author: new FormControl('', [Validators.required]),
    description: new FormControl('', [Validators.required]),
    price: new FormControl('', [Validators.required]),
    imageurl: new FormControl('', [Validators.required]),
  });
  showModal: boolean = false;
  showDeleteModal: boolean = false;
  isEditMode: boolean = false;
  modalTitle: string = '';
  currentBook: Book | null = null;
  highestBookId: number = 0;

  selectedFile: File | null = null;
  imageName: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadBooks();
  }

  private loadBooks() {
    const accessToken = sessionStorage.getItem('accessToken');
    const username = sessionStorage.getItem('username');

    if (accessToken && username) {
      this.validateToken(accessToken)
        .pipe(
          switchMap((isValid) => {
            if (isValid) {
              return this.getBooks();
            } else {
              this.errorMessage = 'You need to login to access this content.';
              return of(null);
            }
          }),
          catchError(() => {
            this.errorMessage = 'An error occurred. Please try again later.';
            return of(null);
          })
        )
        .subscribe((books) => {
          this.books$ = books ? of(books) : null;
        });
    } else {
      this.errorMessage = 'You need to login to access this content.';
    }
  }

  private validateToken(token: string): Observable<boolean> {
    return new Observable<boolean>((observer) => {
      observer.next(true);
    });
  }

  private getBooks(): Observable<Book[]> {
    return this.http.get<Book[]>(this.apiUrl).pipe(
      tap((books) => {
        books.sort((a, b) => (b.id || 0) - (a.id || 0));
        if (books.length > 0) {
          this.highestBookId = books[0].id || 0;
        }
      })
    );
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  openModal(mode: string, book?: Book) {
    this.showModal = true;
    if (mode === 'add') {
      this.booksForm.reset();
      this.booksForm.patchValue({ id: this.highestBookId + 1 });
      this.isEditMode = false;
      this.modalTitle = 'Add Book';
      this.imageSrc = null;
    } else if (mode === 'edit' && book) {
      this.isEditMode = true;
      this.modalTitle = 'Edit Book';
      this.currentBook = book;
      this.booksForm.patchValue({
        id: book.id,
        name: book.name,
        author: book.author,
        description: book.description,
        price: book.price.toString(),
        imageurl: book.imageurl,
      });
      this.imageSrc = book.imageurl;
    }
  }

  openDeleteModal(book: Book) {
    this.showDeleteModal = true;
    this.currentBook = book;
  }
  onFormSubmit() {
    if (this.booksForm.valid && this.selectedFile) {
      // Create FormData object for image upload
      let formData: FormData = new FormData();
      formData.append('image', this.selectedFile);

      this.http
        .post<HandleImage[]>(`${this.apiUrl}/upload`, formData)
        .pipe(
          map((data: HandleImage[]) => {
            if (data && data.length > 0) {
              this.booksForm.value.imageurl = data[0].imagePresignedUrl;
              return data[0]; // Return the first item from the response
            } else {
              throw new Error('No image details returned from server');
            }
          })
        )
        .subscribe(
          (response: HandleImage) => {
            // Update the image URL in bookData
            const bookData = {
              ...this.booksForm.getRawValue(), // Get all form values, including disabled fields
              price: parseFloat(this.booksForm.value.price as string), // Convert string to number
              imageurl: this.booksForm.value.imageurl as string, // Update book with image URL
            };

            // Log the successful image upload
            console.log('Image ImagePresignedUrl:', bookData.imageurl);

            // Proceed with add/update book
            if (this.isEditMode) {
              this.updateBook(bookData as Book);
            } else {
              this.addBook(bookData as Book);
            }

            // Reset form and close modal
            this.booksForm.reset();
            this.imageSrc = null;
            this.showModal = false;
            this.closeModal();
          },
          (error) => {
            console.error('Error during image upload:', error);
          }
        );
    } else {
      this.booksForm.markAllAsTouched(); // Highlight all validation errors
    }
  }

  addBook(book: Book) {
    this.http.post<Book>(this.apiUrl, book).subscribe({
      next: () => {
        this.loadBooks();
        this.booksForm.reset();
        this.imageSrc = null;
      },
      error: (error) => {
        console.error('There was an error!', error);
      },
    });
  }

  updateBook(book: Book) {
    this.http.put<Book>(this.apiUrl, book).subscribe({
      next: () => {
        this.loadBooks();
        this.booksForm.reset();
        this.imageSrc = null;
      },
      error: (error) => {
        console.error('There was an error!', error);
      },
    });
  }

  confirmDelete() {
    if (this.currentBook) {
      this.http.delete(`${this.apiUrl}/${this.currentBook.id}`).subscribe({
        next: () => {
          this.loadBooks();
          this.closeDeleteModal();
          window.location.reload();
        },
        error: (error) => {
          console.error('There was an error!', error);
        },
      });
    }
  }

  Login() {
    this.clearAllStorage();
    window.location.href = `https://bookstoren01649102.auth.us-east-1.amazoncognito.com/login?client_id=2ri1tj57559n89jebur2d9h6j9&response_type=code&scope=email+openid&redirect_uri=${encodeURIComponent(
      environment.redirect_uri
    )}`;
  }

  private clearAllStorage(): void {
    localStorage.clear();
    sessionStorage.clear();
    this.clearCookies();
    this.books$ = null;
  }

  private clearCookies(): void {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
    }
  }

  onFileChange(event: any): void {
    if (event.target.files.length > 0) {
      this.imageFile = event.target.files[0];
      this.selectedFile = event.target.files[0];
    }
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = (e: ProgressEvent<FileReader>) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          this.imageSrc = result;
          this.booksForm.patchValue({ imageurl: result });
        } else {
          this.imageSrc = null;
          this.booksForm.patchValue({ imageurl: null });
        }
      };

      reader.readAsDataURL(file);
    }
  }

  clearImage(): void {
    this.imageSrc = null;
    const input = document.getElementById(
      'bookImageUpload'
    ) as HTMLInputElement;
    if (input) {
      input.value = ''; // Clear the file input
    }
    this.booksForm.patchValue({ imageurl: null });
  }

  resetForm(): void {
    this.booksForm.reset();
    this.clearImage();
  }

  closeModal(): void {
    const modalElement = document.getElementById('bookModal');
    if (modalElement) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
    this.showModal = false;
    this.booksForm.reset();
    this.imageSrc = null;
  }

  closeDeleteModal(): void {
    const modalElement = document.getElementById('deleteModal');
    if (modalElement) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
    this.showDeleteModal = false;
  }
}
