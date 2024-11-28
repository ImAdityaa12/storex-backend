export const calculateDiscount = (price: number, salePrice: number) => {
  const discountAmount = (price - salePrice) / price;
  const discountedPrice = discountAmount * 100;
  return discountedPrice;
};
