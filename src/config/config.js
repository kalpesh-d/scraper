export const SCRAPER_CONFIG = {
  CATEGORIES_FILE: "dmart-categories.json",
  PRODUCTS_FILE: "dmart-products.json",
  CATEGORIES_API:
    "https://digital.dmart.in/api/v1/categories/@top?profile=details&storeId=10654",
  BASE_URL: "https://www.dmart.in",
  DELAY_BETWEEN_REQUESTS: 2000,
  BROWSER_CONFIG: {
    headless: false,
    defaultViewport: null,
  },
};

export const BLINKIT_CONFIG = {
  CATEGORIES_FILE: "blinkit-categories.json",
  PRODUCTS_FILE: "blinkit-products.json",
  BASE_URL: "https://blinkit.com",
  CATEGORIES_URL: "https://blinkit.com/categories",
  PINCODE: "400053",
  DELAY_BETWEEN_REQUESTS: 2000,
  BROWSER_CONFIG: {
    headless: false,
    defaultViewport: null,
  },
};

export const BLINKIT_SELECTORS = {
  CATEGORY_CONTAINER: ".Category__Container-sc-1k4awti-3",
  CATEGORY_LINKS_CONTAINER: "Category__Temp-sc-1k4awti-1",
  CATEGORY_LINK: ".Category__PageLink-sc-1k4awti-2",
  PINCODE_INPUT: ".LocationSearchBox__InputSelect-sc-1k8u6a6-0.fZCGlI",
  PINCODE_SELECT:
    ".LocationSearchList__LocationListContainer-sc-93rfr7-0.lcVvPT .LocationSearchList__LocationLabel-sc-93rfr7-2.FUlwF",
};

export const SELECTORS = {
  PRODUCT_GRID:
    ".MuiGrid-root.MuiGrid-container.MuiGrid-spacing-xs-1.mui-style-tuxzvu .MuiGrid-item",
  PRODUCT_NAME: ".vertical-card_title__pMGg9",
  PRODUCT_IMAGE: ".vertical-card_image__yNgf2",
  PRODUCT_PRICE: ".vertical-card_amount__80Zwk",
  PRODUCT_SAVE_PRICE:
    "section:nth-child(2) > p.vertical-card_value__2EBnX > span.vertical-card_amount__80Zwk",
  PRODUCT_VARIANT:
    "#demo-customized-select .bootstrap-select_option__SB_Xy span:first-child",
};
