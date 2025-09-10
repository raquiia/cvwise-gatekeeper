import { supabase } from '@/integrations/supabase/client';

export interface Country {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Hub {
  id: string;
  country_id: string;
  name: string;
  city: string;
  address?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  country?: Country;
}

export const geoService = {
  // Countries
  async getCountries(): Promise<Country[]> {
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) throw new Error(error.message);
    return data || [];
  },

  async getAllCountries(): Promise<Country[]> {
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .order('name');
    
    if (error) throw new Error(error.message);
    return data || [];
  },

  async createCountry(country: Omit<Country, 'id' | 'created_at' | 'updated_at'>): Promise<Country> {
    const { data, error } = await supabase
      .from('countries')
      .insert(country)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },

  async updateCountry(id: string, updates: Partial<Country>): Promise<Country> {
    const { data, error } = await supabase
      .from('countries')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },

  async deleteCountry(id: string): Promise<void> {
    const { error } = await supabase
      .from('countries')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(error.message);
  },

  // Hubs
  async getHubs(): Promise<Hub[]> {
    const { data, error } = await supabase
      .from('hubs')
      .select(`
        *,
        country:countries(*)
      `)
      .eq('is_active', true)
      .order('city');
    
    if (error) throw new Error(error.message);
    return data || [];
  },

  async getAllHubs(): Promise<Hub[]> {
    const { data, error } = await supabase
      .from('hubs')
      .select(`
        *,
        country:countries(*)
      `)
      .order('city');
    
    if (error) throw new Error(error.message);
    return data || [];
  },

  async getHubsByCountry(countryId: string): Promise<Hub[]> {
    const { data, error } = await supabase
      .from('hubs')
      .select(`
        *,
        country:countries(*)
      `)
      .eq('country_id', countryId)
      .eq('is_active', true)
      .order('city');
    
    if (error) throw new Error(error.message);
    return data || [];
  },

  async createHub(hub: Omit<Hub, 'id' | 'created_at' | 'updated_at' | 'country'>): Promise<Hub> {
    const { data, error } = await supabase
      .from('hubs')
      .insert(hub)
      .select(`
        *,
        country:countries(*)
      `)
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },

  async updateHub(id: string, updates: Partial<Hub>): Promise<Hub> {
    const { data, error } = await supabase
      .from('hubs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        country:countries(*)
      `)
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },

  async deleteHub(id: string): Promise<void> {
    const { error } = await supabase
      .from('hubs')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(error.message);
  }
};