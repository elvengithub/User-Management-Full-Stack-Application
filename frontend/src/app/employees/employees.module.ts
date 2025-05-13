import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { EmployeesRoutingModule } from './employees-routing.module';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    EmployeesRoutingModule
  ],
  declarations: []
})
export class EmployeesModule { } 