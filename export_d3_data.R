# Export Data for D3
library(readr)
library(tidyverse)
library(jsonlite)
library(tidyverse)
library(here)
library(sf)
library(mapdata)
library(readxl)
library(stringr)
library(geojsonio)
library(rmapshaper)

urban_bb = read_csv2(here("Datasets", "US_Urban_Rate_Broadband_Survey.csv"))

d3_test = tibble(dload_speed = as.numeric(urban_bb$`Download Bandwidth Mbps`), 
                 total_charge = as.numeric(urban_bb$`Total Charge`),
                 tech = urban_bb$Technology)
d3_test %>% toJSON() %>% write_lines(here("D3", "urban_bb_sub.json"))

d3_test[1:200,] %>% toJSON() %>% write_lines(here("D3", "urban_bb_small.json"))


land_area = read_excel(here("Datasets", "LND01.xls")) %>% select(STCOU, LND110210D)
# Oglala Lakota County, SD was Shannon County before 2015, which needs to be corrected, as apparently this area database ("LND01.xls") has not been updated since the name change
land_area[land_area$STCOU == 46113,]$STCOU = 46102
acs_17 = land_area %>% rename(GEOID = STCOU, land_area = LND110210D) %>% right_join(readRDS(here("Datasets", "acs_17_vals.rds"))) %>% separate(NAME, c("subregion", "state"), sep = ", ") %>% filter(state != "Puerto Rico")

# vector of indices to not normalize in some way
unmodified_vars = c(1, 2, 3, 4, 22, 23, 24, 32, 35)
acs_17_mod = acs_17[1:length(acs_17[[1]]) ,unmodified_vars] %>%
  bind_cols(data.frame(pop_dens = (acs_17$total_pop / acs_17[,2]))) %>% 
  bind_cols(as_tibble(acs_17[, -unmodified_vars] / acs_17$total_pop)) %>% 
  rename("pop_dens" = land_area1, "avg_fam_inc" = aggr_fam_inc) %>% st_as_sf()

geo_js = acs_17_mod %>% geojson_json(group = "geometry", geometry = "polygon")

geo_js = ms_simplify(geo_js)

geo_js %>% write_lines(here("D3", "acs_geo_data_simp.geojson"))
