import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Role } from '../_models';
import { AuthGuard } from '../_helpers';

const routes: Routes = [
    {
        path: '', 
        children: [
            { path: '', redirectTo: 'list', pathMatch: 'full' },
            { path: 'list', loadChildren: () => import('./list/list.module').then(m => m.ListModule) },
            { path: 'employee/:id', loadChildren: () => import('./list/list.module').then(m => m.ListModule) }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class WorkflowsRoutingModule { } 