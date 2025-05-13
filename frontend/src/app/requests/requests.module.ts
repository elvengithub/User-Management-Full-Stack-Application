import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { RequestsRoutingModule } from './requests-routing.module';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RequestsRoutingModule
  ],
  declarations: []
})
export class RequestsModule { } 