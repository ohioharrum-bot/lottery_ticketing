import { SupabaseClient } from '@supabase/supabase-js'

export async function fetchActiveTurn(supabase: SupabaseClient) {
  // First try 'turns' table (ended_at IS NULL)
  try {
    const { data: turnData, error: turnErr } = await supabase
      .from('turns')
      .select('*')
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)

    if (!turnErr && turnData && turnData.length > 0) {
      return { turn: turnData[0], tableName: 'turns' }
    }
  } catch (e) {
    // Fall back to shifts
  }

  // Try 'shifts' table (ended_at IS NULL or is_active = true)
  try {
    const { data: shiftData, error: shiftErr } = await supabase
      .from('shifts')
      .select('*')
      .eq('is_active', true)
      .order('started_at', { ascending: false })
      .limit(1)

    if (!shiftErr && shiftData && shiftData.length > 0) {
      return { turn: shiftData[0], tableName: 'shifts' }
    }
  } catch (e) {
    // Ignore
  }

  return { turn: null, tableName: 'turns' }
}

export async function fetchTurnEntries(supabase: SupabaseClient, turnId: string) {
  try {
    const { data, error } = await supabase
      .from('turn_entries')
      .select('*')
      .or(`turn_id.eq.${turnId},shift_id.eq.${turnId}`)
      .order('created_at', { ascending: false })

    if (!error && data) {
      return data
    }
  } catch (e) {
    // Fall back to shift_entries
  }

  try {
    const { data, error } = await supabase
      .from('shift_entries')
      .select('*')
      .eq('shift_id', turnId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      return data
    }
  } catch (e) {
    // Ignore
  }

  return []
}

export async function createTurn(supabase: SupabaseClient, userId: string, personName: string) {
  const payload = {
    user_id: userId,
    person_name: personName,
    started_at: new Date().toISOString(),
    ended_at: null,
    is_active: true,
  }

  const { data: turnData, error: turnErr } = await supabase
    .from('turns')
    .insert([payload])
    .select()

  if (!turnErr && turnData) {
    return { data: turnData[0], error: null }
  }

  // Fall back to shifts table
  const { data: shiftData, error: shiftErr } = await supabase
    .from('shifts')
    .insert([payload])
    .select()

  return { data: shiftData ? shiftData[0] : null, error: shiftErr }
}

export async function closeTurn(supabase: SupabaseClient, turnId: string) {
  const updatePayload = {
    ended_at: new Date().toISOString(),
    is_active: false,
  }

  const { error: turnErr } = await supabase
    .from('turns')
    .update(updatePayload)
    .eq('id', turnId)

  if (!turnErr) return { error: null }

  const { error: shiftErr } = await supabase
    .from('shifts')
    .update(updatePayload)
    .eq('id', turnId)

  return { error: shiftErr }
}

export async function fetchPastTurns(supabase: SupabaseClient) {
  try {
    const { data: turnData, error: turnErr } = await supabase
      .from('turns')
      .select('*')
      .not('ended_at', 'is', null)
      .order('started_at', { ascending: false })

    if (!turnErr && turnData) {
      return turnData
    }
  } catch (e) {
    // Ignore
  }

  try {
    const { data: shiftData, error: shiftErr } = await supabase
      .from('shifts')
      .select('*')
      .eq('is_active', false)
      .order('started_at', { ascending: false })

    if (!shiftErr && shiftData) {
      return shiftData
    }
  } catch (e) {
    // Ignore
  }

  return []
}

export async function createTurnEntry(
  supabase: SupabaseClient,
  turnId: string,
  bookId: string,
  startTicket: number,
  paymentType: string = 'cash'
) {
  const payload = {
    turn_id: turnId,
    shift_id: turnId,
    book_id: bookId,
    start_ticket: startTicket,
    payment_type: paymentType,
    created_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('turn_entries')
    .insert([payload])
    .select()

  if (!error && data) return { data: data[0], error: null }

  const { data: shiftEntryData, error: shiftEntryErr } = await supabase
    .from('shift_entries')
    .insert([payload])
    .select()

  return { data: shiftEntryData ? shiftEntryData[0] : null, error: shiftEntryErr }
}

export async function fetchStoreSettings(supabase: SupabaseClient, userId?: string) {
  try {
    let query = supabase.from('store_settings').select('*')
    if (userId) {
      query = query.eq('user_id', userId)
    }
    const { data, error } = await query.order('updated_at', { ascending: false }).limit(1)

    if (!error && data && data.length > 0) {
      return {
        store_name: data[0].store_name || '',
        store_address: data[0].store_address || '',
      }
    }
  } catch (e) {
    // Ignore error
  }
  return { store_name: '', store_address: '' }
}

export async function saveStoreSettings(
  supabase: SupabaseClient,
  userId: string | null,
  storeName: string,
  storeAddress: string
) {
  const payload = {
    user_id: userId,
    store_name: storeName,
    store_address: storeAddress,
    updated_at: new Date().toISOString(),
  }

  try {
    const { data: existing } = await supabase
      .from('store_settings')
      .select('id')
      .order('updated_at', { ascending: false })
      .limit(1)

    if (existing && existing.length > 0) {
      const { error } = await supabase
        .from('store_settings')
        .update(payload)
        .eq('id', existing[0].id)
      return { error }
    } else {
      const { error } = await supabase.from('store_settings').insert([payload])
      return { error }
    }
  } catch (e: any) {
    return { error: e }
  }
}

export async function fetchUserProfile(supabase: SupabaseClient, userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!error && data) {
      return {
        full_name: data.full_name || '',
        email: data.email || '',
      }
    }
  } catch (e) {
    // Ignore
  }
  return { full_name: '', email: '' }
}

export async function saveUserProfile(
  supabase: SupabaseClient,
  userId: string,
  fullName: string,
  email: string
) {
  const payload = {
    id: userId,
    full_name: fullName,
    email: email,
    updated_at: new Date().toISOString(),
  }

  try {
    const { error } = await supabase.from('profiles').upsert(payload)
    return { error }
  } catch (e: any) {
    return { error: e }
  }
}

export async function fetchUserSettings(supabase: SupabaseClient, userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!error && data) {
      return {
        low_stock_alerts: Boolean(data.low_stock_alerts),
        shift_close_reminder: Boolean(data.shift_close_reminder),
        scan_mismatch_alerts: Boolean(data.scan_mismatch_alerts),
      }
    }
  } catch (e) {
    // Ignore
  }
  return {
    low_stock_alerts: true,
    shift_close_reminder: true,
    scan_mismatch_alerts: false,
  }
}

export async function saveUserSettings(
  supabase: SupabaseClient,
  userId: string,
  settings: {
    low_stock_alerts: boolean
    shift_close_reminder: boolean
    scan_mismatch_alerts: boolean
  }
) {
  const payload = {
    user_id: userId,
    low_stock_alerts: settings.low_stock_alerts,
    shift_close_reminder: settings.shift_close_reminder,
    scan_mismatch_alerts: settings.scan_mismatch_alerts,
    updated_at: new Date().toISOString(),
  }

  try {
    const { error } = await supabase
      .from('user_settings')
      .upsert(payload, { onConflict: 'user_id' })
    return { error }
  } catch (e: any) {
    return { error: e }
  }
}

