library(tidyverse)
library(ggplot2)
library(here)
library(ggmap)
library(maps)
library(mapdata)
library(tidycensus)
source("api_keys.R")
census_api_key(census_key)

save_key = FALSE

if (save_key) {
  acs_vars_17 = load_variables(year = 2017, dataset = "acs5")
  saveRDS(acs_vars_17, file = "Datasets/acs_vars_17.rds")
}
acs_17 = get_acs(geography = "county", year = 2017, geometry = TRUE, moe_level = 95,
                 variables = c(total_pop = "B01003_001", white = "B02001_002", 
                               native_amer = "B02010_001", med_age = "B01002_001", med_income = "B19326_001", 
                               female = "B01001_026", aggr_fam_inc = "B19127_001", 
                               below_poverty ="B17001_002", employed = "B27011_003", 
                               commute_time_car = "B08136_002", commute_time_pub_trans = "B08136_007", 
                               commute_time_walk = "B08136_011", commute_time_other = "B08136_012", 
                               month_housing_costs = "B25105_001", work_outside_res_area = "B08008_003", 
                               inet_w_sub = "B28002_002", dial_up_only = "B28002_003", 
                               broadband_any = "B28002_004", cell_inet = "B28002_005", 
                               cell_inet_only = "B28002_006", broadband_wired = "B28002_007", 
                               broadband_wired_only = "B28002_008", satelite = "B28002_009", 
                               satelite_only = "B28002_010", other_inet = "B28002_011", 
                               inet_wo_sub = "B28002_012", no_inet = "B28002_013", 
                               desktop_alone = "B28001_004", smartphone_alone = "B28001_006", 
                               tablet_alone = "B28001_008", other_comp_alone = "B28001_010" ))
acs_17_vals = acs_17 %>% select(-one_of("moe")) %>% spread(key = variable, value = estimate)
acs_17_moes = acs_17 %>% select(-one_of("estimate")) %>% spread(key = variable, value = moe)
saveRDS(acs_17, file = "Datasets/acs_17.rds")
saveRDS(acs_17_vals, file = "Datasets/acs_17_vals.rds")
saveRDS(acs_17_moes, file = "Datasets/acs17_moes.rds")

#acs_old = readRDS(here("Datasets", "Backup", "acs_17_vals.rds"))

