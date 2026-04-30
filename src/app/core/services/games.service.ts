import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { Game } from '@features/paytable-configuration/game.model';

@Injectable({ providedIn: 'root' })
export class GamesService {
  private http = inject(HttpClient);
  private readonly sessionGames = signal<Game[] | null>(null);

  getGames(): Observable<Game[]> {
    const cachedGames = this.sessionGames();

    if (cachedGames) {
      return of(cachedGames);
    }

    return this.http.get<Game[]>('/assets/games.json').pipe(
      tap((games) => this.sessionGames.set(games))
    );
  }
}