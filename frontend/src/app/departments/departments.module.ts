import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { DepartmentsRoutingModule } from './departments-routing.module';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DepartmentsRoutingModule
  ],
  declarations: []
})
export class DepartmentsModule { } 