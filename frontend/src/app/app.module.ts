import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { JwtInterceptor, ErrorInterceptor } from './_helpers';
import { AppComponent } from './app.component';
import { AlertComponent } from './_components';
import { HomeComponent } from './home';

// Feature modules
import { EmployeesModule } from './employees/employees.module';
import { DepartmentsModule } from './departments/departments.module';
import { RequestsModule } from './requests/requests.module';
import { WorkflowsModule } from './workflows/workflows.module';

@NgModule({
    imports: [
        BrowserModule,
        ReactiveFormsModule,
        HttpClientModule,
        AppRoutingModule,
        EmployeesModule,
        DepartmentsModule,
        RequestsModule,
        WorkflowsModule
    ],
    declarations: [
        AppComponent,
        AlertComponent,
        HomeComponent
    ],
    providers: [
        { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true }
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
