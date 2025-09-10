import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  hub_id?: string;
  is_admin?: boolean;
  hub?: {
    id: string;
    name: string;
    city: string;
    country: {
      name: string;
      code: string;
    };
  };
}

export const hubAssignmentService = {
  async getRecruitersWithHubs(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        hub:hubs(
          id,
          name,
          city,
          country:countries(name, code)
        )
      `)
      .order('first_name');
    
    if (error) throw new Error(error.message);
    return data || [];
  },

  async assignRecruiterToHub(recruiterId: string, hubId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        hub_id: hubId,
        updated_at: new Date().toISOString()
      })
      .eq('id', recruiterId);
    
    if (error) throw new Error(error.message);
  },

  async removeRecruiterFromHub(recruiterId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        hub_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', recruiterId);
    
    if (error) throw new Error(error.message);
  },

  async getRecruitersByHub(hubId: string): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        hub:hubs(
          id,
          name,
          city,
          country:countries(name, code)
        )
      `)
      .eq('hub_id', hubId)
      .order('first_name');
    
    if (error) throw new Error(error.message);
    return data || [];
  },

  async getUnassignedRecruiters(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        hub:hubs(
          id,
          name,
          city,
          country:countries(name, code)
        )
      `)
      .is('hub_id', null)
      .order('first_name');
    
    if (error) throw new Error(error.message);
    return data || [];
  }
};