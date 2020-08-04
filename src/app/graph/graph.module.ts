import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GraphRoutingModule } from './graph-routing.module';
import { GraphComponent } from './graph/graph.component';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DatePipe } from '@angular/common';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
@NgModule({
  declarations: [GraphComponent],
  imports: [
    CommonModule,
    GraphRoutingModule,
    NgxChartsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  providers: [DatePipe],
})
export class GraphModule {}
