import { Component } from '@angular/core';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCard, MatCardTitle, MatCardHeader, MatCardActions, MatCardTitleGroup } from "@angular/material/card";
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from "@angular/router";
import { MatIcon } from '@angular/material/icon';


@Component({
  selector: 'app-unauthorized',
  imports: [ MatCard, MatCardTitle, MatCardHeader, MatCardActions, MatCardTitleGroup, 
             MatFormFieldModule, MatInputModule, MatButtonModule, RouterLink, MatIcon],
  templateUrl: './unauthorized.html',
  styleUrl: './unauthorized.scss',
})
export class Unauthorized {}
