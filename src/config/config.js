export const DMART_CONFIG = {
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

export const DMART_SELECTORS = {
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

export const ZEPTO_CONFIG = {
  CATEGORIES_FILE: "zepto-categories.json",
  PRODUCTS_FILE: "zepto-products.json",
  BASE_URL: "https://www.zeptonow.com",
  CATEGORIES_URL: "https://www.zeptonow.com/categories",
  LOCATION: "andheri",
  DELAY_BETWEEN_REQUESTS: 2000,
  BROWSER_CONFIG: {
    headless: false,
    defaultViewport: null,
  },
};

export const ZEPTO_SELECTORS = {
  DETECT_LOCATION_BUTTON:
    ".px-7.text-base.border-skin-primary.border.bg-skin-primary.text-skin-base.rounded-md.tracking-widest.mr-4.max-w-\\[8rem\\].\\!basis-1\\/2.py-\\[0\\.5rem\\].\\!px-0.sm\\:mr-6",
  LOCATION_INPUT:
    ".focus\\:outline-none.block.py-3.mx-2.appearance-none.font-subtitle.flex-grow.font-normal.bg-transparent.text-md.\\!text-sm",
  LOCATION_SUGGESTION_CONTAINER:
    ".flex.cursor-pointer.items-center.pt-4.text-left.undefined",
  LOCATION_SUGGESTION_TEXT:
    "h4.font-heading.text-lg.tracking-wide.line-clamp-1.mb-1.capitalize",
  CONFIRM_LOCATION_BUTTON:
    ".py-1.px-7.text-base.border-skin-primary.border.bg-skin-primary.text-skin-base.rounded-md.tracking-widest.w-full.\\!py-3\\.5.font-bold",
  CATEGORY_LINK: "a.contents",
  SUBCATEGORY_CONTAINER: ".plp-cat-sub-category-container",
  SUBCATEGORY_ITEM: ".plp-cat-sub-category-item",
  SUBCATEGORY_NAME: ".plp-cat-sub-cate-name",
  PRODUCTS_CONTAINER:
    ".grid.h-full.w-full.grid-cols-2.gap-y-4.content-start.gap-x-2.px-2\\.5.py-4.md\\:p-3.md\\:grid-cols-3.md\\:gap-x-3.lg\\:grid-cols-5.xl\\:grid-cols-6.pb-24.no-scrollbar",
  PRODUCT_ITEM: "a.relative.my-3.rounded-t-xl.rounded-b-md.group",
  PRODUCT_IMAGE:
    ".overflow-hidden.rounded-xl.border-\\[0\\.5px\\].border-gray-200 img",
  PRODUCT_NAME: ".font-subtitle.text-lg.tracking-wider.line-clamp-2",
  PRODUCT_VARIANT: ".font-heading.text-lg.tracking-wide.line-clamp-1.mt-1",
  CURRENT_PRICE: ".flex.items-baseline.gap-1 h4",
  ACTUAL_PRICE: ".flex.items-baseline.gap-1 p",
};
