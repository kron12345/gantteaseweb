import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ResourcesComponent } from './resources/resources.component';
import { GanttComponent } from './gantt/gantt.component';

@NgModule({
  declarations: [
    AppComponent,
    ResourcesComponent,
    GanttComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
