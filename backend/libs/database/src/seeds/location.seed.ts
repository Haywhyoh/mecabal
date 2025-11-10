import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { State, LocalGovernmentArea, Ward, Neighborhood, Landmark, LandmarkVerificationStatus } from '../entities';

// Nigerian States Data - Enhanced with region, capital, population, and area
export const NIGERIAN_STATES_DATA = [
  { name: 'Abia', code: 'AB', region: 'South East', capital: 'Umuahia', population: 3700000, areaSqKm: 6320 },
  { name: 'Adamawa', code: 'AD', region: 'North East', capital: 'Yola', population: 4250000, areaSqKm: 36917 },
  { name: 'Akwa Ibom', code: 'AK', region: 'South South', capital: 'Uyo', population: 5480000, areaSqKm: 7081 },
  { name: 'Anambra', code: 'AN', region: 'South East', capital: 'Awka', population: 5500000, areaSqKm: 4844 },
  { name: 'Bauchi', code: 'BA', region: 'North East', capital: 'Bauchi', population: 6500000, areaSqKm: 49119 },
  { name: 'Bayelsa', code: 'BY', region: 'South South', capital: 'Yenagoa', population: 2280000, areaSqKm: 10773 },
  { name: 'Benue', code: 'BE', region: 'North Central', capital: 'Makurdi', population: 5750000, areaSqKm: 34059 },
  { name: 'Borno', code: 'BO', region: 'North East', capital: 'Maiduguri', population: 5850000, areaSqKm: 70898 },
  { name: 'Cross River', code: 'CR', region: 'South South', capital: 'Calabar', population: 3800000, areaSqKm: 20156 },
  { name: 'Delta', code: 'DE', region: 'South South', capital: 'Asaba', population: 5660000, areaSqKm: 17698 },
  { name: 'Ebonyi', code: 'EB', region: 'South East', capital: 'Abakaliki', population: 2880000, areaSqKm: 5670 },
  { name: 'Edo', code: 'ED', region: 'South South', capital: 'Benin City', population: 4235000, areaSqKm: 17802 },
  { name: 'Ekiti', code: 'EK', region: 'South West', capital: 'Ado-Ekiti', population: 3270000, areaSqKm: 6353 },
  { name: 'Enugu', code: 'EN', region: 'South East', capital: 'Enugu', population: 4200000, areaSqKm: 7161 },
  { name: 'FCT', code: 'FC', region: 'North Central', capital: 'Abuja', population: 3560000, areaSqKm: 7315 },
  { name: 'Gombe', code: 'GO', region: 'North East', capital: 'Gombe', population: 3250000, areaSqKm: 18768 },
  { name: 'Imo', code: 'IM', region: 'South East', capital: 'Owerri', population: 5400000, areaSqKm: 5530 },
  { name: 'Jigawa', code: 'JI', region: 'North West', capital: 'Dutse', population: 5800000, areaSqKm: 23154 },
  { name: 'Kaduna', code: 'KD', region: 'North West', capital: 'Kaduna', population: 8250000, areaSqKm: 46053 },
  { name: 'Kano', code: 'KN', region: 'North West', capital: 'Kano', population: 13076892, areaSqKm: 20131 },
  { name: 'Katsina', code: 'KT', region: 'North West', capital: 'Katsina', population: 7830000, areaSqKm: 24192 },
  { name: 'Kebbi', code: 'KE', region: 'North West', capital: 'Birnin Kebbi', population: 4440000, areaSqKm: 36800 },
  { name: 'Kogi', code: 'KO', region: 'North Central', capital: 'Lokoja', population: 4470000, areaSqKm: 29833 },
  { name: 'Kwara', code: 'KW', region: 'North Central', capital: 'Ilorin', population: 3190000, areaSqKm: 36825 },
  { name: 'Lagos', code: 'LA', region: 'South West', capital: 'Ikeja', population: 14862000, areaSqKm: 3577 },
  { name: 'Nasarawa', code: 'NA', region: 'North Central', capital: 'Lafia', population: 2500000, areaSqKm: 27117 },
  { name: 'Niger', code: 'NI', region: 'North Central', capital: 'Minna', population: 5560000, areaSqKm: 76363 },
  { name: 'Ogun', code: 'OG', region: 'South West', capital: 'Abeokuta', population: 5280000, areaSqKm: 16762 },
  { name: 'Ondo', code: 'ON', region: 'South West', capital: 'Akure', population: 4670000, areaSqKm: 15500 },
  { name: 'Osun', code: 'OS', region: 'South West', capital: 'Osogbo', population: 4700000, areaSqKm: 9251 },
  { name: 'Oyo', code: 'OY', region: 'South West', capital: 'Ibadan', population: 7000000, areaSqKm: 28454 },
  { name: 'Plateau', code: 'PL', region: 'North Central', capital: 'Jos', population: 4200000, areaSqKm: 30913 },
  { name: 'Rivers', code: 'RI', region: 'South South', capital: 'Port Harcourt', population: 5195000, areaSqKm: 11077 },
  { name: 'Sokoto', code: 'SO', region: 'North West', capital: 'Sokoto', population: 4990000, areaSqKm: 25973 },
  { name: 'Taraba', code: 'TA', region: 'North East', capital: 'Jalingo', population: 3066000, areaSqKm: 54473 },
  { name: 'Yobe', code: 'YO', region: 'North East', capital: 'Damaturu', population: 3220000, areaSqKm: 45502 },
  { name: 'Zamfara', code: 'ZA', region: 'North West', capital: 'Gusau', population: 4515000, areaSqKm: 39762 },
];

// All 774 Local Government Areas in Nigeria
// Data source: https://github.com/xosasx/nigerian-local-government-areas
export const ALL_LGAS_DATA = [
  // Abia (17 LGAs)
  { name: 'Aba North', code: 'AB-001', stateCode: 'AB' },
  { name: 'Aba South', code: 'AB-002', stateCode: 'AB' },
  { name: 'Arochukwu', code: 'AB-003', stateCode: 'AB' },
  { name: 'Bende', code: 'AB-004', stateCode: 'AB' },
  { name: 'Ikwuano', code: 'AB-005', stateCode: 'AB' },
  { name: 'Isiala Ngwa North', code: 'AB-006', stateCode: 'AB' },
  { name: 'Isiala Ngwa South', code: 'AB-007', stateCode: 'AB' },
  { name: 'Isuikwuato', code: 'AB-008', stateCode: 'AB' },
  { name: 'Obi Ngwa', code: 'AB-009', stateCode: 'AB' },
  { name: 'Ohafia', code: 'AB-010', stateCode: 'AB' },
  { name: 'Osisioma', code: 'AB-011', stateCode: 'AB' },
  { name: 'Ugwunagbo', code: 'AB-012', stateCode: 'AB' },
  { name: 'Ukwa East', code: 'AB-013', stateCode: 'AB' },
  { name: 'Ukwa West', code: 'AB-014', stateCode: 'AB' },
  { name: 'Umu-Nneochi', code: 'AB-015', stateCode: 'AB' },
  { name: 'Umuahia North', code: 'AB-016', stateCode: 'AB' },
  { name: 'Umuahia South', code: 'AB-017', stateCode: 'AB' },

  // Adamawa (21 LGAs)
  { name: 'Demsa', code: 'AD-018', stateCode: 'AD' },
  { name: 'Fufore', code: 'AD-019', stateCode: 'AD' },
  { name: 'Ganye', code: 'AD-020', stateCode: 'AD' },
  { name: 'Girei', code: 'AD-021', stateCode: 'AD' },
  { name: 'Gombi', code: 'AD-022', stateCode: 'AD' },
  { name: 'Guyuk', code: 'AD-023', stateCode: 'AD' },
  { name: 'Hong', code: 'AD-024', stateCode: 'AD' },
  { name: 'Jada', code: 'AD-025', stateCode: 'AD' },
  { name: 'Lamurde', code: 'AD-026', stateCode: 'AD' },
  { name: 'Madagali', code: 'AD-027', stateCode: 'AD' },
  { name: 'Maiha', code: 'AD-028', stateCode: 'AD' },
  { name: 'Mayo Belwa', code: 'AD-029', stateCode: 'AD' },
  { name: 'Michika', code: 'AD-030', stateCode: 'AD' },
  { name: 'Mubi North', code: 'AD-031', stateCode: 'AD' },
  { name: 'Mubi South', code: 'AD-032', stateCode: 'AD' },
  { name: 'Numan', code: 'AD-033', stateCode: 'AD' },
  { name: 'Shelleng', code: 'AD-034', stateCode: 'AD' },
  { name: 'Song', code: 'AD-035', stateCode: 'AD' },
  { name: 'Toungo', code: 'AD-036', stateCode: 'AD' },
  { name: 'Yola North', code: 'AD-037', stateCode: 'AD' },
  { name: 'Yola South', code: 'AD-038', stateCode: 'AD' },

  // Akwa Ibom (31 LGAs)
  { name: 'Abak', code: 'AK-039', stateCode: 'AK' },
  { name: 'Eastern Obolo', code: 'AK-040', stateCode: 'AK' },
  { name: 'Eket', code: 'AK-041', stateCode: 'AK' },
  { name: 'Esit Eket', code: 'AK-042', stateCode: 'AK' },
  { name: 'Essien Udim', code: 'AK-043', stateCode: 'AK' },
  { name: 'Etim Ekpo', code: 'AK-044', stateCode: 'AK' },
  { name: 'Etinan', code: 'AK-045', stateCode: 'AK' },
  { name: 'Ibeno', code: 'AK-046', stateCode: 'AK' },
  { name: 'Ibesikpo Asutan', code: 'AK-047', stateCode: 'AK' },
  { name: 'Ibiono Ibom', code: 'AK-048', stateCode: 'AK' },
  { name: 'Ika', code: 'AK-049', stateCode: 'AK' },
  { name: 'Ikono', code: 'AK-050', stateCode: 'AK' },
  { name: 'Ikot Abasi', code: 'AK-051', stateCode: 'AK' },
  { name: 'Ikot Ekpene', code: 'AK-052', stateCode: 'AK' },
  { name: 'Ini', code: 'AK-053', stateCode: 'AK' },
  { name: 'Itu', code: 'AK-054', stateCode: 'AK' },
  { name: 'Mbo', code: 'AK-055', stateCode: 'AK' },
  { name: 'Mkpat Enin', code: 'AK-056', stateCode: 'AK' },
  { name: 'Nsit Atai', code: 'AK-057', stateCode: 'AK' },
  { name: 'Nsit Ibom', code: 'AK-058', stateCode: 'AK' },
  { name: 'Nsit Ubium', code: 'AK-059', stateCode: 'AK' },
  { name: 'Obot Akara', code: 'AK-060', stateCode: 'AK' },
  { name: 'Okobo', code: 'AK-061', stateCode: 'AK' },
  { name: 'Onna', code: 'AK-062', stateCode: 'AK' },
  { name: 'Oron', code: 'AK-063', stateCode: 'AK' },
  { name: 'Oruk Anam', code: 'AK-064', stateCode: 'AK' },
  { name: 'Udung Uko', code: 'AK-065', stateCode: 'AK' },
  { name: 'Ukanafun', code: 'AK-066', stateCode: 'AK' },
  { name: 'Uruan', code: 'AK-067', stateCode: 'AK' },
  { name: 'Urue Offong/Oruko', code: 'AK-068', stateCode: 'AK' },
  { name: 'Uyo', code: 'AK-069', stateCode: 'AK' },

  // Anambra (21 LGAs)
  { name: 'Aguata', code: 'AN-070', stateCode: 'AN' },
  { name: 'Anambra East', code: 'AN-071', stateCode: 'AN' },
  { name: 'Anambra West', code: 'AN-072', stateCode: 'AN' },
  { name: 'Anaocha', code: 'AN-073', stateCode: 'AN' },
  { name: 'Awka North', code: 'AN-074', stateCode: 'AN' },
  { name: 'Awka South', code: 'AN-075', stateCode: 'AN' },
  { name: 'Ayamelum', code: 'AN-076', stateCode: 'AN' },
  { name: 'Dunukofia', code: 'AN-077', stateCode: 'AN' },
  { name: 'Ekwusigo', code: 'AN-078', stateCode: 'AN' },
  { name: 'Idemili North', code: 'AN-079', stateCode: 'AN' },
  { name: 'Idemili South', code: 'AN-080', stateCode: 'AN' },
  { name: 'Ihiala', code: 'AN-081', stateCode: 'AN' },
  { name: 'Njikoka', code: 'AN-082', stateCode: 'AN' },
  { name: 'Nnewi North', code: 'AN-083', stateCode: 'AN' },
  { name: 'Nnewi South', code: 'AN-084', stateCode: 'AN' },
  { name: 'Ogbaru', code: 'AN-085', stateCode: 'AN' },
  { name: 'Onitsha North', code: 'AN-086', stateCode: 'AN' },
  { name: 'Onitsha South', code: 'AN-087', stateCode: 'AN' },
  { name: 'Orumba North', code: 'AN-088', stateCode: 'AN' },
  { name: 'Orumba South', code: 'AN-089', stateCode: 'AN' },
  { name: 'Oyi', code: 'AN-090', stateCode: 'AN' },

  // Bauchi (20 LGAs)
  { name: 'Alkaleri', code: 'BA-091', stateCode: 'BA' },
  { name: 'Bauchi', code: 'BA-092', stateCode: 'BA' },
  { name: 'Bogoro', code: 'BA-093', stateCode: 'BA' },
  { name: 'Damban', code: 'BA-094', stateCode: 'BA' },
  { name: 'Darazo', code: 'BA-095', stateCode: 'BA' },
  { name: 'Dass', code: 'BA-096', stateCode: 'BA' },
  { name: 'Gamawa', code: 'BA-097', stateCode: 'BA' },
  { name: 'Ganjuwa', code: 'BA-098', stateCode: 'BA' },
  { name: 'Giade', code: 'BA-099', stateCode: 'BA' },
  { name: 'Itas/Gadau', code: 'BA-100', stateCode: 'BA' },
  { name: 'Jama\'are', code: 'BA-101', stateCode: 'BA' },
  { name: 'Katagum', code: 'BA-102', stateCode: 'BA' },
  { name: 'Kirfi', code: 'BA-103', stateCode: 'BA' },
  { name: 'Misau', code: 'BA-104', stateCode: 'BA' },
  { name: 'Ningi', code: 'BA-105', stateCode: 'BA' },
  { name: 'Shira', code: 'BA-106', stateCode: 'BA' },
  { name: 'Tafawa Balewa', code: 'BA-107', stateCode: 'BA' },
  { name: 'Toro', code: 'BA-108', stateCode: 'BA' },
  { name: 'Warji', code: 'BA-109', stateCode: 'BA' },
  { name: 'Zaki', code: 'BA-110', stateCode: 'BA' },

  // Benue (23 LGAs)
  { name: 'Ado', code: 'BE-119', stateCode: 'BE' },
  { name: 'Agatu', code: 'BE-120', stateCode: 'BE' },
  { name: 'Apa', code: 'BE-121', stateCode: 'BE' },
  { name: 'Buruku', code: 'BE-122', stateCode: 'BE' },
  { name: 'Gboko', code: 'BE-123', stateCode: 'BE' },
  { name: 'Guma', code: 'BE-124', stateCode: 'BE' },
  { name: 'Gwer East', code: 'BE-125', stateCode: 'BE' },
  { name: 'Gwer West', code: 'BE-126', stateCode: 'BE' },
  { name: 'Katsina Ala', code: 'BE-127', stateCode: 'BE' },
  { name: 'Konshisha', code: 'BE-128', stateCode: 'BE' },
  { name: 'Kwande', code: 'BE-129', stateCode: 'BE' },
  { name: 'Logo', code: 'BE-130', stateCode: 'BE' },
  { name: 'Makurdi', code: 'BE-131', stateCode: 'BE' },
  { name: 'Obi', code: 'BE-132', stateCode: 'BE' },
  { name: 'Ogbadibo', code: 'BE-133', stateCode: 'BE' },
  { name: 'Ohimini', code: 'BE-134', stateCode: 'BE' },
  { name: 'Oju', code: 'BE-135', stateCode: 'BE' },
  { name: 'Okpokwu', code: 'BE-136', stateCode: 'BE' },
  { name: 'Otukpo', code: 'BE-137', stateCode: 'BE' },
  { name: 'Tarka', code: 'BE-138', stateCode: 'BE' },
  { name: 'Ukum', code: 'BE-139', stateCode: 'BE' },
  { name: 'Ushongo', code: 'BE-140', stateCode: 'BE' },
  { name: 'Vandeikya', code: 'BE-141', stateCode: 'BE' },

  // Borno (27 LGAs)
  { name: 'Abadam', code: 'BO-142', stateCode: 'BO' },
  { name: 'Askira/Uba', code: 'BO-143', stateCode: 'BO' },
  { name: 'Bama', code: 'BO-144', stateCode: 'BO' },
  { name: 'Bayo', code: 'BO-145', stateCode: 'BO' },
  { name: 'Biu', code: 'BO-146', stateCode: 'BO' },
  { name: 'Chibok', code: 'BO-147', stateCode: 'BO' },
  { name: 'Damboa', code: 'BO-148', stateCode: 'BO' },
  { name: 'Dikwa', code: 'BO-149', stateCode: 'BO' },
  { name: 'Gubio', code: 'BO-150', stateCode: 'BO' },
  { name: 'Guzamala', code: 'BO-151', stateCode: 'BO' },
  { name: 'Gwoza', code: 'BO-152', stateCode: 'BO' },
  { name: 'Hawul', code: 'BO-153', stateCode: 'BO' },
  { name: 'Jere', code: 'BO-154', stateCode: 'BO' },
  { name: 'Kaga', code: 'BO-155', stateCode: 'BO' },
  { name: 'Kala/Balge', code: 'BO-156', stateCode: 'BO' },
  { name: 'Konduga', code: 'BO-157', stateCode: 'BO' },
  { name: 'Kukawa', code: 'BO-158', stateCode: 'BO' },
  { name: 'Kwaya Kusar', code: 'BO-159', stateCode: 'BO' },
  { name: 'Mafa', code: 'BO-160', stateCode: 'BO' },
  { name: 'Magumeri', code: 'BO-161', stateCode: 'BO' },
  { name: 'Maiduguri', code: 'BO-162', stateCode: 'BO' },
  { name: 'Marte', code: 'BO-163', stateCode: 'BO' },
  { name: 'Mobbar', code: 'BO-164', stateCode: 'BO' },
  { name: 'Monguno', code: 'BO-165', stateCode: 'BO' },
  { name: 'Ngala', code: 'BO-166', stateCode: 'BO' },
  { name: 'Nganzai', code: 'BO-167', stateCode: 'BO' },
  { name: 'Shani', code: 'BO-168', stateCode: 'BO' },

  // Bayelsa (8 LGAs)
  { name: 'Brass', code: 'BY-111', stateCode: 'BY' },
  { name: 'Ekeremor', code: 'BY-112', stateCode: 'BY' },
  { name: 'Kolokuma/Opokuma', code: 'BY-113', stateCode: 'BY' },
  { name: 'Nembe', code: 'BY-114', stateCode: 'BY' },
  { name: 'Ogbia', code: 'BY-115', stateCode: 'BY' },
  { name: 'Sagbama', code: 'BY-116', stateCode: 'BY' },
  { name: 'Southern Ijaw', code: 'BY-117', stateCode: 'BY' },
  { name: 'Yenagoa', code: 'BY-118', stateCode: 'BY' },

  // Cross River (18 LGAs)
  { name: 'Abi', code: 'CR-169', stateCode: 'CR' },
  { name: 'Akamkpa', code: 'CR-170', stateCode: 'CR' },
  { name: 'Akpabuyo', code: 'CR-171', stateCode: 'CR' },
  { name: 'Bakassi', code: 'CR-172', stateCode: 'CR' },
  { name: 'Bekwarra', code: 'CR-173', stateCode: 'CR' },
  { name: 'Biase', code: 'CR-174', stateCode: 'CR' },
  { name: 'Boki', code: 'CR-175', stateCode: 'CR' },
  { name: 'Calabar Municipal', code: 'CR-176', stateCode: 'CR' },
  { name: 'Calabar South', code: 'CR-177', stateCode: 'CR' },
  { name: 'Etung', code: 'CR-178', stateCode: 'CR' },
  { name: 'Ikom', code: 'CR-179', stateCode: 'CR' },
  { name: 'Obanliku', code: 'CR-180', stateCode: 'CR' },
  { name: 'Obubra', code: 'CR-181', stateCode: 'CR' },
  { name: 'Obudu', code: 'CR-182', stateCode: 'CR' },
  { name: 'Odukpani', code: 'CR-183', stateCode: 'CR' },
  { name: 'Ogoja', code: 'CR-184', stateCode: 'CR' },
  { name: 'Yakurr', code: 'CR-185', stateCode: 'CR' },
  { name: 'Yala', code: 'CR-186', stateCode: 'CR' },

  // Delta (25 LGAs)
  { name: 'Aniocha North', code: 'DE-187', stateCode: 'DE' },
  { name: 'Aniocha South', code: 'DE-188', stateCode: 'DE' },
  { name: 'Bomadi', code: 'DE-189', stateCode: 'DE' },
  { name: 'Burutu', code: 'DE-190', stateCode: 'DE' },
  { name: 'Ethiope East', code: 'DE-191', stateCode: 'DE' },
  { name: 'Ethiope West', code: 'DE-192', stateCode: 'DE' },
  { name: 'Ika North East', code: 'DE-193', stateCode: 'DE' },
  { name: 'Ika South', code: 'DE-194', stateCode: 'DE' },
  { name: 'Isoko North', code: 'DE-195', stateCode: 'DE' },
  { name: 'Isoko South', code: 'DE-196', stateCode: 'DE' },
  { name: 'Ndokwa East', code: 'DE-197', stateCode: 'DE' },
  { name: 'Ndokwa West', code: 'DE-198', stateCode: 'DE' },
  { name: 'Okpe', code: 'DE-199', stateCode: 'DE' },
  { name: 'Oshimili North', code: 'DE-200', stateCode: 'DE' },
  { name: 'Oshimili South', code: 'DE-201', stateCode: 'DE' },
  { name: 'Patani', code: 'DE-202', stateCode: 'DE' },
  { name: 'Sapele', code: 'DE-203', stateCode: 'DE' },
  { name: 'Udu', code: 'DE-204', stateCode: 'DE' },
  { name: 'Ughelli North', code: 'DE-205', stateCode: 'DE' },
  { name: 'Ughelli South', code: 'DE-206', stateCode: 'DE' },
  { name: 'Ukwuani', code: 'DE-207', stateCode: 'DE' },
  { name: 'Uvwie', code: 'DE-208', stateCode: 'DE' },
  { name: 'Warri North', code: 'DE-209', stateCode: 'DE' },
  { name: 'Warri South', code: 'DE-210', stateCode: 'DE' },
  { name: 'Warri South West', code: 'DE-211', stateCode: 'DE' },

  // Ebonyi (13 LGAs)
  { name: 'Abakaliki', code: 'EB-212', stateCode: 'EB' },
  { name: 'Afikpo North', code: 'EB-213', stateCode: 'EB' },
  { name: 'Afikpo South', code: 'EB-214', stateCode: 'EB' },
  { name: 'Ebonyi', code: 'EB-215', stateCode: 'EB' },
  { name: 'Ezza North', code: 'EB-216', stateCode: 'EB' },
  { name: 'Ezza South', code: 'EB-217', stateCode: 'EB' },
  { name: 'Ishielu', code: 'EB-218', stateCode: 'EB' },
  { name: 'Ivo', code: 'EB-219', stateCode: 'EB' },
  { name: 'Izzi', code: 'EB-220', stateCode: 'EB' },
  { name: 'Ohaozara', code: 'EB-221', stateCode: 'EB' },
  { name: 'Ohaukwu', code: 'EB-222', stateCode: 'EB' },
  { name: 'Onicha', code: 'EB-223', stateCode: 'EB' },
  { name: 'Ikwo', code: 'EB-224', stateCode: 'EB' },

  // Edo (18 LGAs)
  { name: 'Akoko Edo', code: 'ED-225', stateCode: 'ED' },
  { name: 'Egor', code: 'ED-226', stateCode: 'ED' },
  { name: 'Esan Central', code: 'ED-227', stateCode: 'ED' },
  { name: 'Esan North East', code: 'ED-228', stateCode: 'ED' },
  { name: 'Esan South East', code: 'ED-229', stateCode: 'ED' },
  { name: 'Esan West', code: 'ED-230', stateCode: 'ED' },
  { name: 'Etsako Central', code: 'ED-231', stateCode: 'ED' },
  { name: 'Etsako East', code: 'ED-232', stateCode: 'ED' },
  { name: 'Etsako West', code: 'ED-233', stateCode: 'ED' },
  { name: 'Igueben', code: 'ED-234', stateCode: 'ED' },
  { name: 'Ikpoba Okha', code: 'ED-235', stateCode: 'ED' },
  { name: 'Oredo', code: 'ED-236', stateCode: 'ED' },
  { name: 'Orhionmwon', code: 'ED-237', stateCode: 'ED' },
  { name: 'Ovia North East', code: 'ED-238', stateCode: 'ED' },
  { name: 'Ovia South West', code: 'ED-239', stateCode: 'ED' },
  { name: 'Owan East', code: 'ED-240', stateCode: 'ED' },
  { name: 'Owan West', code: 'ED-241', stateCode: 'ED' },
  { name: 'Uhunmwonde', code: 'ED-242', stateCode: 'ED' },

  // Ekiti (16 LGAs)
  { name: 'Ado-Ekiti', code: 'EK-243', stateCode: 'EK' },
  { name: 'Efon', code: 'EK-244', stateCode: 'EK' },
  { name: 'Ekiti East', code: 'EK-245', stateCode: 'EK' },
  { name: 'Ekiti South West', code: 'EK-246', stateCode: 'EK' },
  { name: 'Ekiti West', code: 'EK-247', stateCode: 'EK' },
  { name: 'Emure', code: 'EK-248', stateCode: 'EK' },
  { name: 'Gbonyin', code: 'EK-249', stateCode: 'EK' },
  { name: 'Ido-Osi', code: 'EK-250', stateCode: 'EK' },
  { name: 'Ijero', code: 'EK-251', stateCode: 'EK' },
  { name: 'Ikere', code: 'EK-252', stateCode: 'EK' },
  { name: 'Ikole', code: 'EK-253', stateCode: 'EK' },
  { name: 'Ilejemeje', code: 'EK-254', stateCode: 'EK' },
  { name: 'Irepodun/Ifelodun', code: 'EK-255', stateCode: 'EK' },
  { name: 'Ise/Orun', code: 'EK-256', stateCode: 'EK' },
  { name: 'Moba', code: 'EK-257', stateCode: 'EK' },
  { name: 'Oye', code: 'EK-258', stateCode: 'EK' },

  // Enugu (17 LGAs)
  { name: 'Aninri', code: 'EN-259', stateCode: 'EN' },
  { name: 'Awgu', code: 'EN-260', stateCode: 'EN' },
  { name: 'Enugu East', code: 'EN-261', stateCode: 'EN' },
  { name: 'Enugu North', code: 'EN-262', stateCode: 'EN' },
  { name: 'Enugu South', code: 'EN-263', stateCode: 'EN' },
  { name: 'Ezeagu', code: 'EN-264', stateCode: 'EN' },
  { name: 'Igbo Etiti', code: 'EN-265', stateCode: 'EN' },
  { name: 'Igbo Eze North', code: 'EN-266', stateCode: 'EN' },
  { name: 'Igbo Eze South', code: 'EN-267', stateCode: 'EN' },
  { name: 'Isi-Uzo', code: 'EN-268', stateCode: 'EN' },
  { name: 'Nkanu East', code: 'EN-269', stateCode: 'EN' },
  { name: 'Nkanu West', code: 'EN-270', stateCode: 'EN' },
  { name: 'Nsukka', code: 'EN-271', stateCode: 'EN' },
  { name: 'Oji-River', code: 'EN-272', stateCode: 'EN' },
  { name: 'Udenu', code: 'EN-273', stateCode: 'EN' },
  { name: 'Udi', code: 'EN-274', stateCode: 'EN' },
  { name: 'Uzo-Uwani', code: 'EN-275', stateCode: 'EN' },

  // Federal Capital Territory (6 LGAs)
  { name: 'Abaji', code: 'FC-276', stateCode: 'FC' },
  { name: 'Abuja', code: 'FC-277', stateCode: 'FC' },
  { name: 'Bwari', code: 'FC-278', stateCode: 'FC' },
  { name: 'Gwagwalada', code: 'FC-279', stateCode: 'FC' },
  { name: 'Kuje', code: 'FC-280', stateCode: 'FC' },
  { name: 'Kwali', code: 'FC-281', stateCode: 'FC' },

  // Gombe (11 LGAs)
  { name: 'Akko', code: 'GO-282', stateCode: 'GO' },
  { name: 'Balanga', code: 'GO-283', stateCode: 'GO' },
  { name: 'Billiri', code: 'GO-284', stateCode: 'GO' },
  { name: 'Dukku', code: 'GO-285', stateCode: 'GO' },
  { name: 'Funakaye', code: 'GO-286', stateCode: 'GO' },
  { name: 'Gombe', code: 'GO-287', stateCode: 'GO' },
  { name: 'Kaltungo', code: 'GO-288', stateCode: 'GO' },
  { name: 'Kwami', code: 'GO-289', stateCode: 'GO' },
  { name: 'Nafada', code: 'GO-290', stateCode: 'GO' },
  { name: 'Shongom', code: 'GO-291', stateCode: 'GO' },
  { name: 'Yamaltu/Deba', code: 'GO-292', stateCode: 'GO' },

  // Imo (27 LGAs)
  { name: 'Aboh Mbaise', code: 'IM-293', stateCode: 'IM' },
  { name: 'Ahiazu Mbaise', code: 'IM-294', stateCode: 'IM' },
  { name: 'Ehime Mbano', code: 'IM-295', stateCode: 'IM' },
  { name: 'Ezinihitte Mbaise', code: 'IM-296', stateCode: 'IM' },
  { name: 'Ideato North', code: 'IM-297', stateCode: 'IM' },
  { name: 'Ideato South', code: 'IM-298', stateCode: 'IM' },
  { name: 'Ihitte/Uboma', code: 'IM-299', stateCode: 'IM' },
  { name: 'Ikeduru', code: 'IM-300', stateCode: 'IM' },
  { name: 'Isiala Mbano', code: 'IM-301', stateCode: 'IM' },
  { name: 'Isu', code: 'IM-302', stateCode: 'IM' },
  { name: 'Mbaitoli', code: 'IM-303', stateCode: 'IM' },
  { name: 'Ngor Okpala', code: 'IM-304', stateCode: 'IM' },
  { name: 'Njaba', code: 'IM-305', stateCode: 'IM' },
  { name: 'Nkwerre', code: 'IM-306', stateCode: 'IM' },
  { name: 'Nwangele', code: 'IM-307', stateCode: 'IM' },
  { name: 'Obowo', code: 'IM-308', stateCode: 'IM' },
  { name: 'Oguta', code: 'IM-309', stateCode: 'IM' },
  { name: 'Ohaji/Egbema', code: 'IM-310', stateCode: 'IM' },
  { name: 'Okigwe', code: 'IM-311', stateCode: 'IM' },
  { name: 'Onuimo', code: 'IM-312', stateCode: 'IM' },
  { name: 'Orlu', code: 'IM-313', stateCode: 'IM' },
  { name: 'Orsu', code: 'IM-314', stateCode: 'IM' },
  { name: 'Oru East', code: 'IM-315', stateCode: 'IM' },
  { name: 'Oru West', code: 'IM-316', stateCode: 'IM' },
  { name: 'Owerri Municipal', code: 'IM-317', stateCode: 'IM' },
  { name: 'Owerri North', code: 'IM-318', stateCode: 'IM' },
  { name: 'Owerri West', code: 'IM-319', stateCode: 'IM' },

  // Jigawa (27 LGAs)
  { name: 'Auyo', code: 'JI-320', stateCode: 'JI' },
  { name: 'Babura', code: 'JI-321', stateCode: 'JI' },
  { name: 'Biriniwa', code: 'JI-322', stateCode: 'JI' },
  { name: 'Birnin Kudu', code: 'JI-323', stateCode: 'JI' },
  { name: 'Buji', code: 'JI-324', stateCode: 'JI' },
  { name: 'Dutse', code: 'JI-325', stateCode: 'JI' },
  { name: 'Gagarawa', code: 'JI-326', stateCode: 'JI' },
  { name: 'Garki', code: 'JI-327', stateCode: 'JI' },
  { name: 'Gumel', code: 'JI-328', stateCode: 'JI' },
  { name: 'Guri', code: 'JI-329', stateCode: 'JI' },
  { name: 'Gwaram', code: 'JI-330', stateCode: 'JI' },
  { name: 'Gwiwa', code: 'JI-331', stateCode: 'JI' },
  { name: 'Hadejia', code: 'JI-332', stateCode: 'JI' },
  { name: 'Jahun', code: 'JI-333', stateCode: 'JI' },
  { name: 'Kafin Hausa', code: 'JI-334', stateCode: 'JI' },
  { name: 'Kaugama', code: 'JI-335', stateCode: 'JI' },
  { name: 'Kazaure', code: 'JI-336', stateCode: 'JI' },
  { name: 'Kiri Kasama', code: 'JI-337', stateCode: 'JI' },
  { name: 'Kiyawa', code: 'JI-338', stateCode: 'JI' },
  { name: 'Maigatari', code: 'JI-339', stateCode: 'JI' },
  { name: 'Malam Madori', code: 'JI-340', stateCode: 'JI' },
  { name: 'Miga', code: 'JI-341', stateCode: 'JI' },
  { name: 'Ringim', code: 'JI-342', stateCode: 'JI' },
  { name: 'Roni', code: 'JI-343', stateCode: 'JI' },
  { name: 'Sule Tankarkar', code: 'JI-344', stateCode: 'JI' },
  { name: 'Taura', code: 'JI-345', stateCode: 'JI' },
  { name: 'Yankwashi', code: 'JI-346', stateCode: 'JI' },

  // Kaduna (23 LGAs)
  { name: 'Birnin Gwari', code: 'KD-347', stateCode: 'KD' },
  { name: 'Chikun', code: 'KD-348', stateCode: 'KD' },
  { name: 'Giwa', code: 'KD-349', stateCode: 'KD' },
  { name: 'Igabi', code: 'KD-350', stateCode: 'KD' },
  { name: 'Ikara', code: 'KD-351', stateCode: 'KD' },
  { name: 'Jaba', code: 'KD-352', stateCode: 'KD' },
  { name: 'Jema\'a', code: 'KD-353', stateCode: 'KD' },
  { name: 'Kachia', code: 'KD-354', stateCode: 'KD' },
  { name: 'Kaduna North', code: 'KD-355', stateCode: 'KD' },
  { name: 'Kaduna South', code: 'KD-356', stateCode: 'KD' },
  { name: 'Kagarko', code: 'KD-357', stateCode: 'KD' },
  { name: 'Kajuru', code: 'KD-358', stateCode: 'KD' },
  { name: 'Kaura', code: 'KD-359', stateCode: 'KD' },
  { name: 'Kauru', code: 'KD-360', stateCode: 'KD' },
  { name: 'Kubau', code: 'KD-361', stateCode: 'KD' },
  { name: 'Kudan', code: 'KD-362', stateCode: 'KD' },
  { name: 'Lere', code: 'KD-363', stateCode: 'KD' },
  { name: 'Makarfi', code: 'KD-364', stateCode: 'KD' },
  { name: 'Sabon Gari', code: 'KD-365', stateCode: 'KD' },
  { name: 'Sanga', code: 'KD-366', stateCode: 'KD' },
  { name: 'Soba', code: 'KD-367', stateCode: 'KD' },
  { name: 'Zangon Kataf', code: 'KD-368', stateCode: 'KD' },
  { name: 'Zaria', code: 'KD-369', stateCode: 'KD' },

  // Kebbi (21 LGAs)
  { name: 'Aliero', code: 'KE-448', stateCode: 'KE' },
  { name: 'Arewa Dandi', code: 'KE-449', stateCode: 'KE' },
  { name: 'Argungu', code: 'KE-450', stateCode: 'KE' },
  { name: 'Augie', code: 'KE-451', stateCode: 'KE' },
  { name: 'Bagudo', code: 'KE-452', stateCode: 'KE' },
  { name: 'Birnin Kebbi', code: 'KE-453', stateCode: 'KE' },
  { name: 'Bunza', code: 'KE-454', stateCode: 'KE' },
  { name: 'Dandi', code: 'KE-455', stateCode: 'KE' },
  { name: 'Danko-Wasagu', code: 'KE-456', stateCode: 'KE' },
  { name: 'Fakai', code: 'KE-457', stateCode: 'KE' },
  { name: 'Gwandu', code: 'KE-458', stateCode: 'KE' },
  { name: 'Jega', code: 'KE-459', stateCode: 'KE' },
  { name: 'Kalgo', code: 'KE-460', stateCode: 'KE' },
  { name: 'Koko/Besse', code: 'KE-461', stateCode: 'KE' },
  { name: 'Maiyama', code: 'KE-462', stateCode: 'KE' },
  { name: 'Ngaski', code: 'KE-463', stateCode: 'KE' },
  { name: 'Sakaba', code: 'KE-464', stateCode: 'KE' },
  { name: 'Shanga', code: 'KE-465', stateCode: 'KE' },
  { name: 'Suru', code: 'KE-466', stateCode: 'KE' },
  { name: 'Yauri', code: 'KE-467', stateCode: 'KE' },
  { name: 'Zuru', code: 'KE-468', stateCode: 'KE' },

  // Kano (44 LGAs)
  { name: 'Ajingi', code: 'KN-370', stateCode: 'KN' },
  { name: 'Albasu', code: 'KN-371', stateCode: 'KN' },
  { name: 'Bagwai', code: 'KN-372', stateCode: 'KN' },
  { name: 'Bebeji', code: 'KN-373', stateCode: 'KN' },
  { name: 'Bichi', code: 'KN-374', stateCode: 'KN' },
  { name: 'Bunkure', code: 'KN-375', stateCode: 'KN' },
  { name: 'Dala', code: 'KN-376', stateCode: 'KN' },
  { name: 'Dambatta', code: 'KN-377', stateCode: 'KN' },
  { name: 'Dawakin Kudu', code: 'KN-378', stateCode: 'KN' },
  { name: 'Dawakin Tofa', code: 'KN-379', stateCode: 'KN' },
  { name: 'Doguwa', code: 'KN-380', stateCode: 'KN' },
  { name: 'Fagge', code: 'KN-381', stateCode: 'KN' },
  { name: 'Gabasawa', code: 'KN-382', stateCode: 'KN' },
  { name: 'Garko', code: 'KN-383', stateCode: 'KN' },
  { name: 'Garun Malam', code: 'KN-384', stateCode: 'KN' },
  { name: 'Gaya', code: 'KN-385', stateCode: 'KN' },
  { name: 'Gezawa', code: 'KN-386', stateCode: 'KN' },
  { name: 'Gwale', code: 'KN-387', stateCode: 'KN' },
  { name: 'Gwarzo', code: 'KN-388', stateCode: 'KN' },
  { name: 'Kabo', code: 'KN-389', stateCode: 'KN' },
  { name: 'Kano Municipal', code: 'KN-390', stateCode: 'KN' },
  { name: 'Karaye', code: 'KN-391', stateCode: 'KN' },
  { name: 'Kibiya', code: 'KN-392', stateCode: 'KN' },
  { name: 'Kiru', code: 'KN-393', stateCode: 'KN' },
  { name: 'Kunchi', code: 'KN-394', stateCode: 'KN' },
  { name: 'Kura', code: 'KN-395', stateCode: 'KN' },
  { name: 'Madobi', code: 'KN-396', stateCode: 'KN' },
  { name: 'Makoda', code: 'KN-397', stateCode: 'KN' },
  { name: 'Minjibir', code: 'KN-398', stateCode: 'KN' },
  { name: 'Nasarawa', code: 'KN-399', stateCode: 'KN' },
  { name: 'Rano', code: 'KN-400', stateCode: 'KN' },
  { name: 'Rimin Gado', code: 'KN-401', stateCode: 'KN' },
  { name: 'Rogo', code: 'KN-402', stateCode: 'KN' },
  { name: 'Shanono', code: 'KN-403', stateCode: 'KN' },
  { name: 'Sumaila', code: 'KN-404', stateCode: 'KN' },
  { name: 'Takai', code: 'KN-405', stateCode: 'KN' },
  { name: 'Tarauni', code: 'KN-406', stateCode: 'KN' },
  { name: 'Tofa', code: 'KN-407', stateCode: 'KN' },
  { name: 'Tsanyawa', code: 'KN-408', stateCode: 'KN' },
  { name: 'Tudun Wada', code: 'KN-409', stateCode: 'KN' },
  { name: 'Ungogo', code: 'KN-410', stateCode: 'KN' },
  { name: 'Warawa', code: 'KN-411', stateCode: 'KN' },
  { name: 'Wudil', code: 'KN-412', stateCode: 'KN' },
  { name: 'kumbotso', code: 'KN-413', stateCode: 'KN' },

  // Kogi (21 LGAs)
  { name: 'Adavi', code: 'KO-469', stateCode: 'KO' },
  { name: 'Ajaokuta', code: 'KO-470', stateCode: 'KO' },
  { name: 'Ankpa', code: 'KO-471', stateCode: 'KO' },
  { name: 'Bassa', code: 'KO-472', stateCode: 'KO' },
  { name: 'Dekina', code: 'KO-473', stateCode: 'KO' },
  { name: 'Ibaji', code: 'KO-474', stateCode: 'KO' },
  { name: 'Idah', code: 'KO-475', stateCode: 'KO' },
  { name: 'Igalamela Odolu', code: 'KO-476', stateCode: 'KO' },
  { name: 'Ijumu', code: 'KO-477', stateCode: 'KO' },
  { name: 'Kabba/Bunu', code: 'KO-478', stateCode: 'KO' },
  { name: 'Kogi', code: 'KO-479', stateCode: 'KO' },
  { name: 'Lokoja', code: 'KO-480', stateCode: 'KO' },
  { name: 'Mopa-Muro', code: 'KO-481', stateCode: 'KO' },
  { name: 'Ofu', code: 'KO-482', stateCode: 'KO' },
  { name: 'Ogori/Magongo', code: 'KO-483', stateCode: 'KO' },
  { name: 'Okehi', code: 'KO-484', stateCode: 'KO' },
  { name: 'Okene', code: 'KO-485', stateCode: 'KO' },
  { name: 'Olamaboro', code: 'KO-486', stateCode: 'KO' },
  { name: 'Omala', code: 'KO-487', stateCode: 'KO' },
  { name: 'Yagba East', code: 'KO-488', stateCode: 'KO' },
  { name: 'Yagba West', code: 'KO-489', stateCode: 'KO' },

  // Katsina (34 LGAs)
  { name: 'Bakori', code: 'KT-414', stateCode: 'KT' },
  { name: 'Batagarawa', code: 'KT-415', stateCode: 'KT' },
  { name: 'Batsari', code: 'KT-416', stateCode: 'KT' },
  { name: 'Baure', code: 'KT-417', stateCode: 'KT' },
  { name: 'Bindawa', code: 'KT-418', stateCode: 'KT' },
  { name: 'Charanchi', code: 'KT-419', stateCode: 'KT' },
  { name: 'Dan Musa', code: 'KT-420', stateCode: 'KT' },
  { name: 'DanDume', code: 'KT-421', stateCode: 'KT' },
  { name: 'Danja', code: 'KT-422', stateCode: 'KT' },
  { name: 'Daura', code: 'KT-423', stateCode: 'KT' },
  { name: 'Dutsi', code: 'KT-424', stateCode: 'KT' },
  { name: 'Dutsin-Ma', code: 'KT-425', stateCode: 'KT' },
  { name: 'Faskari', code: 'KT-426', stateCode: 'KT' },
  { name: 'Funtua', code: 'KT-427', stateCode: 'KT' },
  { name: 'Ingawa', code: 'KT-428', stateCode: 'KT' },
  { name: 'Jibia', code: 'KT-429', stateCode: 'KT' },
  { name: 'Kafur', code: 'KT-430', stateCode: 'KT' },
  { name: 'Kaita', code: 'KT-431', stateCode: 'KT' },
  { name: 'Kankara', code: 'KT-432', stateCode: 'KT' },
  { name: 'Kankia', code: 'KT-433', stateCode: 'KT' },
  { name: 'Katsina', code: 'KT-434', stateCode: 'KT' },
  { name: 'Kurfi', code: 'KT-435', stateCode: 'KT' },
  { name: 'Kusada', code: 'KT-436', stateCode: 'KT' },
  { name: 'Mai\'Adua', code: 'KT-437', stateCode: 'KT' },
  { name: 'Malumfashi', code: 'KT-438', stateCode: 'KT' },
  { name: 'Mani', code: 'KT-439', stateCode: 'KT' },
  { name: 'Mashi', code: 'KT-440', stateCode: 'KT' },
  { name: 'Matazu', code: 'KT-441', stateCode: 'KT' },
  { name: 'Musawa', code: 'KT-442', stateCode: 'KT' },
  { name: 'Rimi', code: 'KT-443', stateCode: 'KT' },
  { name: 'Sabuwa', code: 'KT-444', stateCode: 'KT' },
  { name: 'Safana', code: 'KT-445', stateCode: 'KT' },
  { name: 'Sandamu', code: 'KT-446', stateCode: 'KT' },
  { name: 'Zango', code: 'KT-447', stateCode: 'KT' },

  // Kwara (16 LGAs)
  { name: 'Asa', code: 'KW-490', stateCode: 'KW' },
  { name: 'Baruten', code: 'KW-491', stateCode: 'KW' },
  { name: 'Edu', code: 'KW-492', stateCode: 'KW' },
  { name: 'Ekiti', code: 'KW-493', stateCode: 'KW' },
  { name: 'Ifelodun', code: 'KW-494', stateCode: 'KW' },
  { name: 'Ilorin East', code: 'KW-495', stateCode: 'KW' },
  { name: 'Ilorin South', code: 'KW-496', stateCode: 'KW' },
  { name: 'Ilorin West', code: 'KW-497', stateCode: 'KW' },
  { name: 'Irepodun', code: 'KW-498', stateCode: 'KW' },
  { name: 'Isin', code: 'KW-499', stateCode: 'KW' },
  { name: 'Kaiama', code: 'KW-500', stateCode: 'KW' },
  { name: 'Moro', code: 'KW-501', stateCode: 'KW' },
  { name: 'Offa', code: 'KW-502', stateCode: 'KW' },
  { name: 'Oke-Ero', code: 'KW-503', stateCode: 'KW' },
  { name: 'Oyun', code: 'KW-504', stateCode: 'KW' },
  { name: 'Pategi', code: 'KW-505', stateCode: 'KW' },

  // Lagos (20 LGAs)
  { name: 'Agege', code: 'LA-506', stateCode: 'LA' },
  { name: 'Ajeromi-Ifelodun', code: 'LA-507', stateCode: 'LA' },
  { name: 'Alimosho', code: 'LA-508', stateCode: 'LA' },
  { name: 'Amuwo-Odofin', code: 'LA-509', stateCode: 'LA' },
  { name: 'Apapa', code: 'LA-510', stateCode: 'LA' },
  { name: 'Badagry', code: 'LA-511', stateCode: 'LA' },
  { name: 'Epe', code: 'LA-512', stateCode: 'LA' },
  { name: 'Eti-Osa', code: 'LA-513', stateCode: 'LA' },
  { name: 'Ibeju-Lekki', code: 'LA-514', stateCode: 'LA' },
  { name: 'Ifako-Ijaiye', code: 'LA-515', stateCode: 'LA' },
  { name: 'Ikeja', code: 'LA-516', stateCode: 'LA' },
  { name: 'Ikorodu', code: 'LA-517', stateCode: 'LA' },
  { name: 'Kosofe', code: 'LA-518', stateCode: 'LA' },
  { name: 'Lagos Island', code: 'LA-519', stateCode: 'LA' },
  { name: 'Lagos Mainland', code: 'LA-520', stateCode: 'LA' },
  { name: 'Mushin', code: 'LA-521', stateCode: 'LA' },
  { name: 'Ojo', code: 'LA-522', stateCode: 'LA' },
  { name: 'Oshodi-Isolo', code: 'LA-523', stateCode: 'LA' },
  { name: 'Somolu', code: 'LA-524', stateCode: 'LA' },
  { name: 'Surulere', code: 'LA-525', stateCode: 'LA' },

  // Nasarawa (13 LGAs)
  { name: 'Akwanga', code: 'NA-526', stateCode: 'NA' },
  { name: 'Awe', code: 'NA-527', stateCode: 'NA' },
  { name: 'Doma', code: 'NA-528', stateCode: 'NA' },
  { name: 'Karu', code: 'NA-529', stateCode: 'NA' },
  { name: 'Keana', code: 'NA-530', stateCode: 'NA' },
  { name: 'Keffi', code: 'NA-531', stateCode: 'NA' },
  { name: 'Kokona', code: 'NA-532', stateCode: 'NA' },
  { name: 'Lafia', code: 'NA-533', stateCode: 'NA' },
  { name: 'Nasarawa', code: 'NA-534', stateCode: 'NA' },
  { name: 'Nasarawa Egon', code: 'NA-535', stateCode: 'NA' },
  { name: 'Obi', code: 'NA-536', stateCode: 'NA' },
  { name: 'Toto', code: 'NA-537', stateCode: 'NA' },
  { name: 'Wamba', code: 'NA-538', stateCode: 'NA' },

  // Niger (25 LGAs)
  { name: 'Agaie', code: 'NI-539', stateCode: 'NI' },
  { name: 'Agwara', code: 'NI-540', stateCode: 'NI' },
  { name: 'Bida', code: 'NI-541', stateCode: 'NI' },
  { name: 'Borgu', code: 'NI-542', stateCode: 'NI' },
  { name: 'Bosso', code: 'NI-543', stateCode: 'NI' },
  { name: 'Chanchaga', code: 'NI-544', stateCode: 'NI' },
  { name: 'Edati', code: 'NI-545', stateCode: 'NI' },
  { name: 'Gbako', code: 'NI-546', stateCode: 'NI' },
  { name: 'Gurara', code: 'NI-547', stateCode: 'NI' },
  { name: 'Katcha', code: 'NI-548', stateCode: 'NI' },
  { name: 'Kontagora', code: 'NI-549', stateCode: 'NI' },
  { name: 'Lapai', code: 'NI-550', stateCode: 'NI' },
  { name: 'Lavun', code: 'NI-551', stateCode: 'NI' },
  { name: 'Magama', code: 'NI-552', stateCode: 'NI' },
  { name: 'Mariga', code: 'NI-553', stateCode: 'NI' },
  { name: 'Mashegu', code: 'NI-554', stateCode: 'NI' },
  { name: 'Mokwa', code: 'NI-555', stateCode: 'NI' },
  { name: 'Munya', code: 'NI-556', stateCode: 'NI' },
  { name: 'Paikoro', code: 'NI-557', stateCode: 'NI' },
  { name: 'Rafi', code: 'NI-558', stateCode: 'NI' },
  { name: 'Rijau', code: 'NI-559', stateCode: 'NI' },
  { name: 'Shiroro', code: 'NI-560', stateCode: 'NI' },
  { name: 'Suleja', code: 'NI-561', stateCode: 'NI' },
  { name: 'Tafa', code: 'NI-562', stateCode: 'NI' },
  { name: 'Wushishi', code: 'NI-563', stateCode: 'NI' },

  // Ogun (20 LGAs)
  { name: 'Abeokuta North', code: 'OG-564', stateCode: 'OG' },
  { name: 'Abeokuta South', code: 'OG-565', stateCode: 'OG' },
  { name: 'Ado-Odo/Ota', code: 'OG-566', stateCode: 'OG' },
  { name: 'Ewekoro', code: 'OG-567', stateCode: 'OG' },
  { name: 'Ifo', code: 'OG-568', stateCode: 'OG' },
  { name: 'Ijebu East', code: 'OG-569', stateCode: 'OG' },
  { name: 'Ijebu North', code: 'OG-570', stateCode: 'OG' },
  { name: 'Ijebu North East', code: 'OG-571', stateCode: 'OG' },
  { name: 'Ijebu Ode', code: 'OG-572', stateCode: 'OG' },
  { name: 'Ikenne', code: 'OG-573', stateCode: 'OG' },
  { name: 'Imeko Afon', code: 'OG-574', stateCode: 'OG' },
  { name: 'Ipokia', code: 'OG-575', stateCode: 'OG' },
  { name: 'Obafemi Owode', code: 'OG-576', stateCode: 'OG' },
  { name: 'Odeda', code: 'OG-577', stateCode: 'OG' },
  { name: 'Odogbolu', code: 'OG-578', stateCode: 'OG' },
  { name: 'Ogun Waterside', code: 'OG-579', stateCode: 'OG' },
  { name: 'Remo North', code: 'OG-580', stateCode: 'OG' },
  { name: 'Shagamu', code: 'OG-581', stateCode: 'OG' },
  { name: 'Yewa North', code: 'OG-582', stateCode: 'OG' },
  { name: 'Yewa South', code: 'OG-583', stateCode: 'OG' },

  // Ondo (18 LGAs)
  { name: 'Akoko North East', code: 'ON-584', stateCode: 'ON' },
  { name: 'Akoko North West', code: 'ON-585', stateCode: 'ON' },
  { name: 'Akoko South East', code: 'ON-586', stateCode: 'ON' },
  { name: 'Akoko South West', code: 'ON-587', stateCode: 'ON' },
  { name: 'Akure North', code: 'ON-588', stateCode: 'ON' },
  { name: 'Akure South', code: 'ON-589', stateCode: 'ON' },
  { name: 'Ese Odo', code: 'ON-590', stateCode: 'ON' },
  { name: 'Idanre', code: 'ON-591', stateCode: 'ON' },
  { name: 'Ifedore', code: 'ON-592', stateCode: 'ON' },
  { name: 'Ilaje', code: 'ON-593', stateCode: 'ON' },
  { name: 'Ile Oluji/Okeigbo', code: 'ON-594', stateCode: 'ON' },
  { name: 'Irele', code: 'ON-595', stateCode: 'ON' },
  { name: 'Odigbo', code: 'ON-596', stateCode: 'ON' },
  { name: 'Okitipupa', code: 'ON-597', stateCode: 'ON' },
  { name: 'Ondo East', code: 'ON-598', stateCode: 'ON' },
  { name: 'Ondo West', code: 'ON-599', stateCode: 'ON' },
  { name: 'Ose', code: 'ON-600', stateCode: 'ON' },
  { name: 'Owo', code: 'ON-601', stateCode: 'ON' },

  // Osun (30 LGAs)
  { name: 'Ayedaade', code: 'OS-602', stateCode: 'OS' },
  { name: 'Aiyedire', code: 'OS-603', stateCode: 'OS' },
  { name: 'Atakunmosa East', code: 'OS-604', stateCode: 'OS' },
  { name: 'Atakunmosa West', code: 'OS-605', stateCode: 'OS' },
  { name: 'Boluwaduro', code: 'OS-606', stateCode: 'OS' },
  { name: 'Boripe', code: 'OS-607', stateCode: 'OS' },
  { name: 'Ede North', code: 'OS-608', stateCode: 'OS' },
  { name: 'Ede South', code: 'OS-609', stateCode: 'OS' },
  { name: 'Egbedore', code: 'OS-610', stateCode: 'OS' },
  { name: 'Ejigbo', code: 'OS-611', stateCode: 'OS' },
  { name: 'Ife Central', code: 'OS-612', stateCode: 'OS' },
  { name: 'Ife East', code: 'OS-613', stateCode: 'OS' },
  { name: 'Ife North', code: 'OS-614', stateCode: 'OS' },
  { name: 'Ife South', code: 'OS-615', stateCode: 'OS' },
  { name: 'Ifedayo', code: 'OS-616', stateCode: 'OS' },
  { name: 'Ifelodun', code: 'OS-617', stateCode: 'OS' },
  { name: 'Ila', code: 'OS-618', stateCode: 'OS' },
  { name: 'Ilesa East', code: 'OS-619', stateCode: 'OS' },
  { name: 'Ilesa West', code: 'OS-620', stateCode: 'OS' },
  { name: 'Irepodun', code: 'OS-621', stateCode: 'OS' },
  { name: 'Irewole', code: 'OS-622', stateCode: 'OS' },
  { name: 'Isokan', code: 'OS-623', stateCode: 'OS' },
  { name: 'Iwo', code: 'OS-624', stateCode: 'OS' },
  { name: 'Obokun', code: 'OS-625', stateCode: 'OS' },
  { name: 'Odo-Otin', code: 'OS-626', stateCode: 'OS' },
  { name: 'Ola-Oluwa', code: 'OS-627', stateCode: 'OS' },
  { name: 'Olorunda', code: 'OS-628', stateCode: 'OS' },
  { name: 'Oriade', code: 'OS-629', stateCode: 'OS' },
  { name: 'Orolu', code: 'OS-630', stateCode: 'OS' },
  { name: 'Osogbo', code: 'OS-631', stateCode: 'OS' },

  // Oyo (33 LGAs)
  { name: 'Afijio', code: 'OY-632', stateCode: 'OY' },
  { name: 'Akinyele', code: 'OY-633', stateCode: 'OY' },
  { name: 'Atiba', code: 'OY-634', stateCode: 'OY' },
  { name: 'Atisbo', code: 'OY-635', stateCode: 'OY' },
  { name: 'Egbeda', code: 'OY-636', stateCode: 'OY' },
  { name: 'Ibadan North', code: 'OY-637', stateCode: 'OY' },
  { name: 'Ibadan North East', code: 'OY-638', stateCode: 'OY' },
  { name: 'Ibadan North West', code: 'OY-639', stateCode: 'OY' },
  { name: 'Ibadan South East', code: 'OY-640', stateCode: 'OY' },
  { name: 'Ibadan South West', code: 'OY-641', stateCode: 'OY' },
  { name: 'Ibarapa Central', code: 'OY-642', stateCode: 'OY' },
  { name: 'Ibarapa East', code: 'OY-643', stateCode: 'OY' },
  { name: 'Ibarapa North', code: 'OY-644', stateCode: 'OY' },
  { name: 'Ido', code: 'OY-645', stateCode: 'OY' },
  { name: 'Irepo', code: 'OY-646', stateCode: 'OY' },
  { name: 'Iseyin', code: 'OY-647', stateCode: 'OY' },
  { name: 'Itesiwaju', code: 'OY-648', stateCode: 'OY' },
  { name: 'Iwajowa', code: 'OY-649', stateCode: 'OY' },
  { name: 'Kajola', code: 'OY-650', stateCode: 'OY' },
  { name: 'Lagelu', code: 'OY-651', stateCode: 'OY' },
  { name: 'Ogbomosho North', code: 'OY-652', stateCode: 'OY' },
  { name: 'Ogbomosho South', code: 'OY-653', stateCode: 'OY' },
  { name: 'Ogo Oluwa', code: 'OY-654', stateCode: 'OY' },
  { name: 'Olorunsogo', code: 'OY-655', stateCode: 'OY' },
  { name: 'Oluyole', code: 'OY-656', stateCode: 'OY' },
  { name: 'Ona Ara', code: 'OY-657', stateCode: 'OY' },
  { name: 'Oorelope', code: 'OY-658', stateCode: 'OY' },
  { name: 'Ori Ire', code: 'OY-659', stateCode: 'OY' },
  { name: 'Oyo East', code: 'OY-660', stateCode: 'OY' },
  { name: 'Oyo West', code: 'OY-661', stateCode: 'OY' },
  { name: 'Saki East', code: 'OY-662', stateCode: 'OY' },
  { name: 'Saki West', code: 'OY-663', stateCode: 'OY' },
  { name: 'Surulere', code: 'OY-664', stateCode: 'OY' },

  // Plateau (17 LGAs)
  { name: 'Barkin Ladi', code: 'PL-665', stateCode: 'PL' },
  { name: 'Bassa', code: 'PL-666', stateCode: 'PL' },
  { name: 'Bokkos', code: 'PL-667', stateCode: 'PL' },
  { name: 'Jos East', code: 'PL-668', stateCode: 'PL' },
  { name: 'Jos North', code: 'PL-669', stateCode: 'PL' },
  { name: 'Jos South', code: 'PL-670', stateCode: 'PL' },
  { name: 'Kanam', code: 'PL-671', stateCode: 'PL' },
  { name: 'Kanke', code: 'PL-672', stateCode: 'PL' },
  { name: 'Langtang North', code: 'PL-673', stateCode: 'PL' },
  { name: 'Langtang South', code: 'PL-674', stateCode: 'PL' },
  { name: 'Mangu', code: 'PL-675', stateCode: 'PL' },
  { name: 'Mikang', code: 'PL-676', stateCode: 'PL' },
  { name: 'Pankshin', code: 'PL-677', stateCode: 'PL' },
  { name: 'Qua\'an Pan', code: 'PL-678', stateCode: 'PL' },
  { name: 'Riyom', code: 'PL-679', stateCode: 'PL' },
  { name: 'Shendam', code: 'PL-680', stateCode: 'PL' },
  { name: 'Wase', code: 'PL-681', stateCode: 'PL' },

  // Rivers (23 LGAs)
  { name: 'Abua-Odual', code: 'RI-682', stateCode: 'RI' },
  { name: 'Ahoada East', code: 'RI-683', stateCode: 'RI' },
  { name: 'Ahoada West', code: 'RI-684', stateCode: 'RI' },
  { name: 'Akuku-Toru', code: 'RI-685', stateCode: 'RI' },
  { name: 'Andoni', code: 'RI-686', stateCode: 'RI' },
  { name: 'Asari-Toru', code: 'RI-687', stateCode: 'RI' },
  { name: 'Bonny', code: 'RI-688', stateCode: 'RI' },
  { name: 'Degema', code: 'RI-689', stateCode: 'RI' },
  { name: 'Eleme', code: 'RI-690', stateCode: 'RI' },
  { name: 'Emohua', code: 'RI-691', stateCode: 'RI' },
  { name: 'Etche', code: 'RI-692', stateCode: 'RI' },
  { name: 'Gokana', code: 'RI-693', stateCode: 'RI' },
  { name: 'Ikwerre', code: 'RI-694', stateCode: 'RI' },
  { name: 'Khana', code: 'RI-695', stateCode: 'RI' },
  { name: 'Obio/Akpor', code: 'RI-696', stateCode: 'RI' },
  { name: 'Ogba/Egbema/Ndoni', code: 'RI-697', stateCode: 'RI' },
  { name: 'Ogu/Bolo', code: 'RI-698', stateCode: 'RI' },
  { name: 'Okrika', code: 'RI-699', stateCode: 'RI' },
  { name: 'Omuma', code: 'RI-700', stateCode: 'RI' },
  { name: 'Opobo/Nkoro', code: 'RI-701', stateCode: 'RI' },
  { name: 'Oyigbo', code: 'RI-702', stateCode: 'RI' },
  { name: 'Port Harcourt', code: 'RI-703', stateCode: 'RI' },
  { name: 'Tai', code: 'RI-704', stateCode: 'RI' },

  // Sokoto (23 LGAs)
  { name: 'Binji', code: 'SO-705', stateCode: 'SO' },
  { name: 'Bodinga', code: 'SO-706', stateCode: 'SO' },
  { name: 'Dange/Shuni', code: 'SO-707', stateCode: 'SO' },
  { name: 'Gada', code: 'SO-708', stateCode: 'SO' },
  { name: 'Goronyo', code: 'SO-709', stateCode: 'SO' },
  { name: 'Gudu', code: 'SO-710', stateCode: 'SO' },
  { name: 'Gwadabawa', code: 'SO-711', stateCode: 'SO' },
  { name: 'Illela', code: 'SO-712', stateCode: 'SO' },
  { name: 'Isa', code: 'SO-713', stateCode: 'SO' },
  { name: 'Kware', code: 'SO-714', stateCode: 'SO' },
  { name: 'Rabah', code: 'SO-715', stateCode: 'SO' },
  { name: 'Sabon Birni', code: 'SO-716', stateCode: 'SO' },
  { name: 'Shagari', code: 'SO-717', stateCode: 'SO' },
  { name: 'Silame', code: 'SO-718', stateCode: 'SO' },
  { name: 'Sokoto North', code: 'SO-719', stateCode: 'SO' },
  { name: 'Sokoto South', code: 'SO-720', stateCode: 'SO' },
  { name: 'Tambuwal', code: 'SO-721', stateCode: 'SO' },
  { name: 'Tangaza', code: 'SO-722', stateCode: 'SO' },
  { name: 'Tureta', code: 'SO-723', stateCode: 'SO' },
  { name: 'Wamako', code: 'SO-724', stateCode: 'SO' },
  { name: 'Wurno', code: 'SO-725', stateCode: 'SO' },
  { name: 'Yabo', code: 'SO-726', stateCode: 'SO' },
  { name: 'Kebbe', code: 'SO-727', stateCode: 'SO' },

  // Taraba (16 LGAs)
  { name: 'Ardo Kola', code: 'TA-728', stateCode: 'TA' },
  { name: 'Bali', code: 'TA-729', stateCode: 'TA' },
  { name: 'Donga', code: 'TA-730', stateCode: 'TA' },
  { name: 'Gashaka', code: 'TA-731', stateCode: 'TA' },
  { name: 'Gassol', code: 'TA-732', stateCode: 'TA' },
  { name: 'Ibi', code: 'TA-733', stateCode: 'TA' },
  { name: 'Jalingo', code: 'TA-734', stateCode: 'TA' },
  { name: 'Karim Lamido', code: 'TA-735', stateCode: 'TA' },
  { name: 'Kurmi', code: 'TA-736', stateCode: 'TA' },
  { name: 'Lau', code: 'TA-737', stateCode: 'TA' },
  { name: 'Sardauna', code: 'TA-738', stateCode: 'TA' },
  { name: 'Takum', code: 'TA-739', stateCode: 'TA' },
  { name: 'Ussa', code: 'TA-740', stateCode: 'TA' },
  { name: 'Wukari', code: 'TA-741', stateCode: 'TA' },
  { name: 'Yorro', code: 'TA-742', stateCode: 'TA' },
  { name: 'Zing', code: 'TA-743', stateCode: 'TA' },

  // Yobe (17 LGAs)
  { name: 'Bade', code: 'YO-744', stateCode: 'YO' },
  { name: 'Bursari', code: 'YO-745', stateCode: 'YO' },
  { name: 'Damaturu', code: 'YO-746', stateCode: 'YO' },
  { name: 'Fika', code: 'YO-747', stateCode: 'YO' },
  { name: 'Fune', code: 'YO-748', stateCode: 'YO' },
  { name: 'Geidam', code: 'YO-749', stateCode: 'YO' },
  { name: 'Gujba', code: 'YO-750', stateCode: 'YO' },
  { name: 'Gulani', code: 'YO-751', stateCode: 'YO' },
  { name: 'Jakusko', code: 'YO-752', stateCode: 'YO' },
  { name: 'Karasuwa', code: 'YO-753', stateCode: 'YO' },
  { name: 'Machina', code: 'YO-754', stateCode: 'YO' },
  { name: 'Nangere', code: 'YO-755', stateCode: 'YO' },
  { name: 'Nguru', code: 'YO-756', stateCode: 'YO' },
  { name: 'Potiskum', code: 'YO-757', stateCode: 'YO' },
  { name: 'Tarmuwa', code: 'YO-758', stateCode: 'YO' },
  { name: 'Yunusari', code: 'YO-759', stateCode: 'YO' },
  { name: 'Yusufari', code: 'YO-760', stateCode: 'YO' },

  // Zamfara (14 LGAs)
  { name: 'Anka', code: 'ZA-761', stateCode: 'ZA' },
  { name: 'Bakura', code: 'ZA-762', stateCode: 'ZA' },
  { name: 'Birnin Magaji/Kiyaw', code: 'ZA-763', stateCode: 'ZA' },
  { name: 'Bukkuyum', code: 'ZA-764', stateCode: 'ZA' },
  { name: 'Bungudu', code: 'ZA-765', stateCode: 'ZA' },
  { name: 'Gummi', code: 'ZA-766', stateCode: 'ZA' },
  { name: 'Gusau', code: 'ZA-767', stateCode: 'ZA' },
  { name: 'Kaura Namoda', code: 'ZA-768', stateCode: 'ZA' },
  { name: 'Maradun', code: 'ZA-769', stateCode: 'ZA' },
  { name: 'Maru', code: 'ZA-770', stateCode: 'ZA' },
  { name: 'Shinkafi', code: 'ZA-771', stateCode: 'ZA' },
  { name: 'Talata Mafara', code: 'ZA-772', stateCode: 'ZA' },
  { name: 'Tsafe', code: 'ZA-773', stateCode: 'ZA' },
  { name: 'Zurmi', code: 'ZA-774', stateCode: 'ZA' }
];

// Sample Wards Data (for major LGAs)
export const SAMPLE_WARDS_DATA = [
  // Agege LGA Wards
  { name: 'Agege Ward 1', code: 'AGE01', lgaName: 'Agege' },
  { name: 'Agege Ward 2', code: 'AGE02', lgaName: 'Agege' },
  { name: 'Agege Ward 3', code: 'AGE03', lgaName: 'Agege' },
  { name: 'Agege Ward 4', code: 'AGE04', lgaName: 'Agege' },
  { name: 'Agege Ward 5', code: 'AGE05', lgaName: 'Agege' },
  
  // Eti-Osa LGA Wards (Lekki area)
  { name: 'Eti-Osa Ward 1', code: 'ETI01', lgaName: 'Eti-Osa' },
  { name: 'Eti-Osa Ward 2', code: 'ETI02', lgaName: 'Eti-Osa' },
  { name: 'Eti-Osa Ward 3', code: 'ETI03', lgaName: 'Eti-Osa' },
  { name: 'Eti-Osa Ward 4', code: 'ETI04', lgaName: 'Eti-Osa' },
  { name: 'Eti-Osa Ward 5', code: 'ETI05', lgaName: 'Eti-Osa' },
  
  // Alimosho LGA Wards
  { name: 'Alimosho Ward 1', code: 'ALI01', lgaName: 'Alimosho' },
  { name: 'Alimosho Ward 2', code: 'ALI02', lgaName: 'Alimosho' },
  { name: 'Alimosho Ward 3', code: 'ALI03', lgaName: 'Alimosho' },
  { name: 'Alimosho Ward 4', code: 'ALI04', lgaName: 'Alimosho' },
  { name: 'Alimosho Ward 5', code: 'ALI05', lgaName: 'Alimosho' },
];

// Neighborhoods Data from NotableNeighboorhoods.txt
export const NEIGHBORHOODS_DATA = [
  // Lekki Neighborhoods (Eti-Osa LGA)
  { name: 'Ajah', type: 'AREA', wardName: 'Eti-Osa Ward 1', lgaName: 'Eti-Osa' },
  { name: 'Ikota', type: 'AREA', wardName: 'Eti-Osa Ward 1', lgaName: 'Eti-Osa' },
  { name: 'Ikate-Elegushi', type: 'AREA', wardName: 'Eti-Osa Ward 1', lgaName: 'Eti-Osa' },
  { name: 'Jakande', type: 'AREA', wardName: 'Eti-Osa Ward 2', lgaName: 'Eti-Osa' },
  { name: 'Phase 1', type: 'AREA', wardName: 'Eti-Osa Ward 2', lgaName: 'Eti-Osa' },
  { name: 'Igbo-Efon', type: 'AREA', wardName: 'Eti-Osa Ward 2', lgaName: 'Eti-Osa' },
  { name: 'Idado', type: 'AREA', wardName: 'Eti-Osa Ward 3', lgaName: 'Eti-Osa' },
  { name: 'Chevron', type: 'AREA', wardName: 'Eti-Osa Ward 3', lgaName: 'Eti-Osa' },
  { name: 'Victoria Garden City', type: 'ESTATE', wardName: 'Eti-Osa Ward 3', lgaName: 'Eti-Osa', isGated: true, requiresVerification: true },
  { name: 'Osapa', type: 'AREA', wardName: 'Eti-Osa Ward 4', lgaName: 'Eti-Osa' },
  { name: 'Agungi', type: 'AREA', wardName: 'Eti-Osa Ward 4', lgaName: 'Eti-Osa' },
  { name: 'Lekki Palm City', type: 'ESTATE', wardName: 'Eti-Osa Ward 4', lgaName: 'Eti-Osa', isGated: true, requiresVerification: true },
  
  // Agege Traditional Communities
  { name: 'Orile Agege', type: 'COMMUNITY', wardName: 'Agege Ward 1', lgaName: 'Agege' },
  { name: 'Ogba', type: 'COMMUNITY', wardName: 'Agege Ward 1', lgaName: 'Agege' },
  { name: 'Isale Oja', type: 'COMMUNITY', wardName: 'Agege Ward 2', lgaName: 'Agege' },
  { name: 'Dopemu', type: 'COMMUNITY', wardName: 'Agege Ward 2', lgaName: 'Agege' },
  { name: 'Oke-Koto', type: 'COMMUNITY', wardName: 'Agege Ward 3', lgaName: 'Agege' },
  { name: 'Sango', type: 'COMMUNITY', wardName: 'Agege Ward 3', lgaName: 'Agege' },
  { name: 'Tabon-Tabon', type: 'COMMUNITY', wardName: 'Agege Ward 4', lgaName: 'Agege' },
  { name: 'Isale Odan', type: 'COMMUNITY', wardName: 'Agege Ward 4', lgaName: 'Agege' },
  { name: 'Ipodo', type: 'COMMUNITY', wardName: 'Agege Ward 5', lgaName: 'Agege' },
  
  // Agege Residential Communities
  { name: 'Mulero', type: 'AREA', wardName: 'Agege Ward 1', lgaName: 'Agege' },
  { name: 'Keke', type: 'AREA', wardName: 'Agege Ward 2', lgaName: 'Agege' },
  { name: 'Mangoro', type: 'AREA', wardName: 'Agege Ward 3', lgaName: 'Agege' },
  { name: 'Oyewole', type: 'AREA', wardName: 'Agege Ward 3', lgaName: 'Agege' },
  { name: 'Lemomu Edara', type: 'AREA', wardName: 'Agege Ward 4', lgaName: 'Agege' },
  { name: 'Ajegunle', type: 'AREA', wardName: 'Agege Ward 5', lgaName: 'Agege' },
  
  // Agege Residential Estates
  { name: 'Maple Wood Estate', type: 'ESTATE', wardName: 'Agege Ward 1', lgaName: 'Agege', isGated: true, requiresVerification: true },
  { name: 'County Estate', type: 'ESTATE', wardName: 'Agege Ward 2', lgaName: 'Agege', isGated: true, requiresVerification: true },
  { name: 'Sunshine Estate', type: 'ESTATE', wardName: 'Agege Ward 3', lgaName: 'Agege', isGated: true, requiresVerification: true },
  { name: 'New Dairy Farm Housing Estate', type: 'ESTATE', wardName: 'Agege Ward 4', lgaName: 'Agege', isGated: true, requiresVerification: true },
];

// Sample Landmarks Data
export const SAMPLE_LANDMARKS_DATA = [
  // Markets
  { name: 'Ikeja City Mall', type: 'MARKET', neighborhoodName: 'Ikeja', lgaName: 'Ikeja' },
  { name: 'Lekki Market', type: 'MARKET', neighborhoodName: 'Ajah', lgaName: 'Eti-Osa' },
  { name: 'Agege Market', type: 'MARKET', neighborhoodName: 'Orile Agege', lgaName: 'Agege' },
  
  // Schools
  { name: 'Lagos State University', type: 'SCHOOL', neighborhoodName: 'Ojo', lgaName: 'Ojo' },
  { name: 'University of Lagos', type: 'SCHOOL', neighborhoodName: 'Akoka', lgaName: 'Yaba' },
  
  // Hospitals
  { name: 'Lagos University Teaching Hospital', type: 'HOSPITAL', neighborhoodName: 'Idi-Araba', lgaName: 'Mushin' },
  { name: 'Eko Hospital', type: 'HOSPITAL', neighborhoodName: 'Ikeja', lgaName: 'Ikeja' },
  
  // Religious Places
  { name: 'National Mosque', type: 'MOSQUE', neighborhoodName: 'Central Business District', lgaName: 'Lagos Island' },
  { name: 'Cathedral Church of Christ', type: 'CHURCH', neighborhoodName: 'Marina', lgaName: 'Lagos Island' },
  
  // Parks
  { name: 'Tafawa Balewa Square', type: 'PARK', neighborhoodName: 'Central Business District', lgaName: 'Lagos Island' },
  { name: 'Lekki Conservation Centre', type: 'PARK', neighborhoodName: 'Lekki', lgaName: 'Eti-Osa' },
];

@Injectable()
export class LocationSeeder {
  private readonly logger = new Logger(LocationSeeder.name);

  constructor(
    @InjectRepository(State)
    private stateRepository: Repository<State>,
    @InjectRepository(LocalGovernmentArea)
    private lgaRepository: Repository<LocalGovernmentArea>,
    @InjectRepository(Ward)
    private wardRepository: Repository<Ward>,
    @InjectRepository(Neighborhood)
    private neighborhoodRepository: Repository<Neighborhood>,
    @InjectRepository(Landmark)
    private landmarkRepository: Repository<Landmark>,
  ) {}

  async seedStates(): Promise<void> {
    this.logger.log('Seeding Nigerian states...');

    for (const stateData of NIGERIAN_STATES_DATA) {
      const existingState = await this.stateRepository.findOne({
        where: { code: stateData.code }
      });

      if (!existingState) {
        const state = this.stateRepository.create({
          name: stateData.name,
          code: stateData.code,
          country: 'Nigeria',
          region: stateData.region,
          capital: stateData.capital,
          population: stateData.population,
          areaSqKm: stateData.areaSqKm,
        });
        await this.stateRepository.save(state);
        this.logger.log(`Created state: ${stateData.name} - ${stateData.capital} (${stateData.region})`);
      } else {
        // Update existing state with new data if fields are missing
        let updated = false;
        if (!existingState.region && stateData.region) {
          existingState.region = stateData.region;
          updated = true;
        }
        if (!existingState.capital && stateData.capital) {
          existingState.capital = stateData.capital;
          updated = true;
        }
        if (!existingState.population && stateData.population) {
          existingState.population = stateData.population;
          updated = true;
        }
        if (!existingState.areaSqKm && stateData.areaSqKm) {
          existingState.areaSqKm = stateData.areaSqKm;
          updated = true;
        }

        if (updated) {
          await this.stateRepository.save(existingState);
          this.logger.log(`Updated state: ${stateData.name} with additional data`);
        } else {
          this.logger.log(`State already exists: ${stateData.name}`);
        }
      }
    }
  }

  async seedAllLGAs(): Promise<void> {
    this.logger.log('Seeding all 774 Local Government Areas across Nigeria...');

    // Get all states for mapping
    const states = await this.stateRepository.find();
    const stateMap = new Map(states.map(s => [s.code, s]));

    let createdCount = 0;
    let existingCount = 0;

    for (const lgaData of ALL_LGAS_DATA) {
      const state = stateMap.get(lgaData.stateCode);

      if (!state) {
        this.logger.warn(`State not found for code: ${lgaData.stateCode}, skipping LGA: ${lgaData.name}`);
        continue;
      }

      const existingLGA = await this.lgaRepository.findOne({
        where: { code: lgaData.code }
      });

      if (!existingLGA) {
        const lga = this.lgaRepository.create({
          name: lgaData.name,
          code: lgaData.code,
          stateId: state.id,
          type: 'LGA' as any // Default to LGA type
        });
        await this.lgaRepository.save(lga);
        createdCount++;

        if (createdCount % 50 === 0) {
          this.logger.log(`Progress: ${createdCount} LGAs created...`);
        }
      } else {
        existingCount++;
      }
    }

    this.logger.log(`✓ LGA seeding completed: ${createdCount} created, ${existingCount} already existed`);
  }

  async seedWards(): Promise<void> {
    this.logger.log('Seeding sample wards...');
    
    for (const wardData of SAMPLE_WARDS_DATA) {
      const lga = await this.lgaRepository.findOne({
        where: { name: wardData.lgaName }
      });

      if (!lga) {
        this.logger.warn(`LGA not found: ${wardData.lgaName}`);
        continue;
      }

      const existingWard = await this.wardRepository.findOne({
        where: { code: wardData.code }
      });

      if (!existingWard) {
        const ward = this.wardRepository.create({
          name: wardData.name,
          code: wardData.code,
          lgaId: lga.id
        });
        await this.wardRepository.save(ward);
        this.logger.log(`Created ward: ${wardData.name}`);
      } else {
        this.logger.log(`Ward already exists: ${wardData.name}`);
      }
    }
  }

  async seedNeighborhoods(): Promise<void> {
    this.logger.log('Seeding neighborhoods...');
    
    for (const neighborhoodData of NEIGHBORHOODS_DATA) {
      const lga = await this.lgaRepository.findOne({
        where: { name: neighborhoodData.lgaName }
      });

      if (!lga) {
        this.logger.warn(`LGA not found: ${neighborhoodData.lgaName}`);
        continue;
      }

      const ward = await this.wardRepository.findOne({
        where: { 
          name: neighborhoodData.wardName,
          lgaId: lga.id
        }
      });

      if (!ward) {
        this.logger.warn(`Ward not found: ${neighborhoodData.wardName} in ${neighborhoodData.lgaName}`);
        continue;
      }

      const existingNeighborhood = await this.neighborhoodRepository.findOne({
        where: { 
          name: neighborhoodData.name,
          wardId: ward.id
        }
      });

      if (!existingNeighborhood) {
        const neighborhood = this.neighborhoodRepository.create({
          name: neighborhoodData.name,
          type: neighborhoodData.type as any,
          lgaId: lga.id,
          wardId: ward.id,
          isGated: neighborhoodData.isGated || false,
          requiresVerification: neighborhoodData.requiresVerification || false
        });
        await this.neighborhoodRepository.save(neighborhood);
        this.logger.log(`Created neighborhood: ${neighborhoodData.name} (${neighborhoodData.type})`);
      } else {
        this.logger.log(`Neighborhood already exists: ${neighborhoodData.name}`);
      }
    }
  }

  async seedLandmarks(): Promise<void> {
    this.logger.log('Seeding sample landmarks...');
    
    for (const landmarkData of SAMPLE_LANDMARKS_DATA) {
      const lga = await this.lgaRepository.findOne({
        where: { name: landmarkData.lgaName }
      });

      if (!lga) {
        this.logger.warn(`LGA not found: ${landmarkData.lgaName}`);
        continue;
      }

      const neighborhood = await this.neighborhoodRepository.findOne({
        where: { 
          name: landmarkData.neighborhoodName,
          ward: { lgaId: lga.id }
        },
        relations: ['ward']
      });

      if (!neighborhood) {
        this.logger.warn(`Neighborhood not found: ${landmarkData.neighborhoodName} in ${landmarkData.lgaName}`);
        continue;
      }

      const existingLandmark = await this.landmarkRepository.findOne({
        where: { 
          name: landmarkData.name,
          neighborhoodId: neighborhood.id
        }
      });

      if (!existingLandmark) {
        const landmark = this.landmarkRepository.create({
          name: landmarkData.name,
          type: landmarkData.type as any,
          neighborhoodId: neighborhood.id,
          verificationStatus: LandmarkVerificationStatus.VERIFIED // Pre-verified sample data
        });
        await this.landmarkRepository.save(landmark);
        this.logger.log(`Created landmark: ${landmarkData.name} (${landmarkData.type})`);
      } else {
        this.logger.log(`Landmark already exists: ${landmarkData.name}`);
      }
    }
  }

  async seedAll(): Promise<void> {
    try {
      this.logger.log('Starting location data seeding...');

      await this.seedStates();
      await this.seedAllLGAs();
      await this.seedWards();
      await this.seedNeighborhoods();
      await this.seedLandmarks();

      this.logger.log('Location data seeding completed successfully!');
    } catch (error) {
      this.logger.error('Error during location data seeding:', error);
      throw error;
    }
  }
}
