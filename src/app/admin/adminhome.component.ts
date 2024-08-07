import { Component, inject } from "@angular/core";
import {
  FormControl,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from "@angular/forms";
import { HttpClient, HttpClientModule } from "@angular/common/http";
import { CommonModule } from "@angular/common";
import { RouterOutlet } from "@angular/router";
import { Observable, tap } from "rxjs";
import { Book } from "../../_models/book.model";

@Component({
  selector: "app-adminhome",
  standalone: true,
  imports: [RouterOutlet, HttpClientModule, ReactiveFormsModule, CommonModule],
  templateUrl: "./adminhome.component.html",
  styleUrls: ["./adminhome.component.css"],
})
export class AdminhomeComponent {
  readonly apiUrl: string =
    "https://82b8crgwq6.execute-api.us-east-1.amazonaws.com/prod/api/books";
  http = inject(HttpClient);
  books$ = this.getBooks();

  booksForm = new FormGroup({
    id: new FormControl("", [Validators.required]),
    name: new FormControl("", [Validators.required]),
    author: new FormControl("", [Validators.required]),
    description: new FormControl("", [Validators.required]),
    price: new FormControl("", [Validators.required]),
    imageurl: new FormControl("", [Validators.required]),
  });

  private getBooks(): Observable<Book[]> {
    return this.http.get<Book[]>(this.apiUrl).pipe(
      tap((books) => {
        books.sort((a, b) => (a.id || 0) - (b.id || 0)); // Sort by 'id'
      })
    );
  }

  onFormSubmit() {
    if (this.booksForm.valid) {
      const addBookRequest = this.booksForm.value;

      this.http.post(this.apiUrl, addBookRequest).subscribe({
        next: () => {
          this.books$ = this.getBooks();
          this.booksForm.reset();
        },
        error: (error) => {
          console.error("There was an error!", error);
        },
      });
    } else {
      // Mark all controls as touched to trigger validation messages
      this.booksForm.markAllAsTouched();
    }
  }

  onEdit(id: number) {
    this.http.delete(`${this.apiUrl}/${id}`).subscribe({
      next: () => {
        this.books$ = this.getBooks();
        this.booksForm.reset();
      },
      error: (error) => {
        console.error("There was an error!", error);
      },
    });
  }

  onDelete(id: number) {
    this.http.delete(`${this.apiUrl}/${id}`).subscribe({
      next: () => {
        this.books$ = this.getBooks();
        this.booksForm.reset();
      },
      error: (error) => {
        console.error("There was an error!", error);
      },
    });
  }
}
