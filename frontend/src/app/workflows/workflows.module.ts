import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { WorkflowsRoutingModule } from './workflows-routing.module';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    WorkflowsRoutingModule
  ],
  declarations: []
})
export class WorkflowsModule { } 