
/**
 * This file is kept for backward compatibility.
 * Please use the new modular files in the job-offers directory for new code.
 */

import { jobOfferService as newJobOfferService } from './job-offers/jobOfferService';
import { JobOffer as JobOfferType } from './job-offers/types';
import { getCountryFromLocation, getCurrencyFromCountry } from './job-offers/utils';

/**
 * Interface pour les offres d'emploi
 */
export interface JobOffer extends JobOfferType {}

/**
 * Service responsable de la gestion des offres d'emploi
 */
export const jobOfferService = {
  ...newJobOfferService,
  getCountryFromLocation,
  getCurrencyFromCountry
};
