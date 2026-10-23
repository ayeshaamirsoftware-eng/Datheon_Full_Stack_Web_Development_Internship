const clean = (s, max = 200) =>
  String(s ?? '').trim().slice(0, max);

export function calculatePrice(
  catalogue,
  items,
  shipping = 'standard',
  code = ''
) {
  if (!Array.isArray(items) || !items.length || items.length > 30) {
    throw new Error('Cart is empty or too large.');
  }

  const normalized = items.map(item => {
    const product = catalogue.find(p => p.id === item.id);

    if (!product) {
      throw new Error('A selected phone is unavailable.');
    }

    const finish = product.colors.find(
      color => color.name === item.finish
    );

    if (
      !finish ||
      !product.ram.includes(Number(item.ram)) ||
      !product.storage.includes(Number(item.storage))
    ) {
      throw new Error(
        `Choose an available ${product.name} configuration.`
      );
    }

    const qty = Number(item.qty);

    if (
      !Number.isInteger(qty) ||
      qty < 1 ||
      qty > product.stock
    ) {
      throw new Error(
        `Only ${product.stock} ${product.name} units are available.`
      );
    }

    const unit =
      product.price +
      (Number(item.ram) - Math.min(...product.ram)) * 5500 +
      product.storage.indexOf(Number(item.storage)) * 16000;

    let customization;

    if (
      product.id === 'sovereign-pro' &&
      item.customization
    ) {
      const choices = {
        texture: ['Satin', 'Gloss', 'Matte'],
        frame: ['Platinum', 'Sapphire', 'Gold'],
        accent: ['Champagne', 'Silver', 'Violet'],
        wallpaper: ['Aurora', 'Ocean', 'Ember', 'Minimal'],
        background: ['Midnight', 'Pearl', 'Violet']
      };

      customization = {};

      for (const [key, allowed] of Object.entries(choices)) {
        if (!allowed.includes(item.customization[key])) {
          throw new Error('Choose an available customization.');
        }

        customization[key] = item.customization[key];
      }
    }

    return {
      id: product.id,
      name: product.name,
      finish: finish.name,
      ram: Number(item.ram),
      storage: Number(item.storage),
      qty,
      unit,
      lineTotal: unit * qty,
      ...(customization ? { customization } : {})
    };
  });

  const subtotal = normalized.reduce(
    (sum, item) => sum + item.lineTotal,
    0
  );

  const coupon = clean(code, 30).toUpperCase();

  if (coupon && coupon !== 'DIALEX10') {
    throw new Error('That coupon is not valid.');
  }

  const discount = coupon
    ? Math.min(Math.round(subtotal * 0.10), 25000)
    : 0;

  if (!['standard', 'express'].includes(shipping)) {
    throw new Error('Choose a shipping method.');
  }

  const shippingFee =
    shipping === 'express'
      ? 3500
      : subtotal >= 300000
        ? 0
        : 1500;

  return {
    items: normalized,
    subtotal,
    discount,
    shippingFee,
    total: subtotal - discount + shippingFee,
    coupon
  };
}