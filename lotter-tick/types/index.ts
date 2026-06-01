export type Book = {
  id: string
  user_id: string
  book_number: string
  game_name: string
  ticket_price: number
  total_tickets: number
  created_at: string
}

export type Shift = {
  id: string
  user_id: string
  started_at: string
  ended_at: string | null
  is_active: boolean
  tickets_cashed: number
  turn_number: number
  person_name: string
}

export type ShiftEntry = {
  id: string
  shift_id: string
  book_id: string
  start_ticket: number
  end_ticket: number | null
  payment_type: 'cash' | 'card' | 'online'
  created_at: string
}