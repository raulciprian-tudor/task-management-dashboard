import { Component, inject, OnInit } from '@angular/core'
import { RouterModule, RouterOutlet } from '@angular/router'
import { SupabaseService } from './core/services/supabase.service'
@Component({
  selector: 'app-root',
  imports: [RouterModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private supabase = inject(SupabaseService)

  ngOnInit(): void {
    console.log('✅ Supabase Client Initialized:', this.supabase.client)
    console.log('🔐 Current User:', this.supabase.currentUser)

    // Subscribe to auth state changes
    this.supabase.currentUser$.subscribe((user) => {
      console.log('👤 Auth State Changed:', user)
    })
  }
}
