// ********** script.js (final version) **********
document.addEventListener('DOMContentLoaded', () => {
  // --- Helper ---
  const qs = sel => document.querySelector(sel);
  const qsa = sel => Array.from(document.querySelectorAll(sel));

  // --- CART SYSTEM ---
  const cartIcon = qs('.cart-icon');
  const cartEl = qs('.cart');
  const cartClose = qs('#cart-close');
  const overlay = qs('.overlay');
  const cartContent = qs('.cart-content');
  const totalPriceElement = qs('.total-price');

  // Create badge if missing
  let cartCountBadge = qs('.cart-count-badge');
  if (!cartCountBadge && cartIcon) {
    cartCountBadge = document.createElement('span');
    cartCountBadge.className = 'cart-count-badge';
    cartCountBadge.style.display = 'none';
    cartIcon.appendChild(cartCountBadge);
  }

  // Find "Add to cart" buttons
  const descBtnElements = qsa('.description-btn *');
  let addButtons = descBtnElements.filter(el =>
    el.textContent && el.textContent.toLowerCase().includes('add to cart')
  );
  if (addButtons.length === 0) {
    const fallback = qs('.description-btn p:nth-child(2)');
    if (fallback) addButtons = [fallback];
  }

  // Frame size / color selections
  const frameCheckboxes = qsa('.frame-size');
  const colorCheckboxes = qsa('.frame-color');
  const frameSizeDisplay = qs('#frameSize');
  const colorDisplay = qs('#frameColor');
  const priceDisplay = qs('#price');
  const colorCodeDisplay = qs('#Color-code');

  // Quantity inputs (bulk)
  const quantityCheckboxes = qsa('#quantity input[type="checkbox"]');

  // --- DEFAULTS ---
  const defaultSize = "5 x 7";
  const defaultColor = "Black";
  const defaultMaterialValue = "Wood";
  const defaultFinishValue = "Glossy";

  const defaultSizeCheckbox = frameCheckboxes.find(cb => cb.value === defaultSize);
  const defaultColorCheckbox = colorCheckboxes.find(cb => cb.value.toLowerCase() === defaultColor.toLowerCase());
  if (defaultSizeCheckbox) defaultSizeCheckbox.checked = true;
  if (defaultColorCheckbox) defaultColorCheckbox.checked = true;

  const defaultMaterial = qs('input[value="Wood"][data-group="materials"]');
  const defaultFinish = qs('input[value="Glossy"][data-group="finishes"]');
  if (defaultMaterial) defaultMaterial.checked = true;
  if (defaultFinish) defaultFinish.checked = true;

  // Display defaults
  const colorCodes = { "Black": ".5", "White": ".1", "Brown": ".2", "Silver": ".3", "Gold": ".4" };
  if (frameSizeDisplay) frameSizeDisplay.innerHTML = `<b>Frame-size:</b> ${defaultSize}`;
  if (colorDisplay) colorDisplay.innerHTML = `<b>Colour:</b> ${defaultColor}`;
  if (colorCodeDisplay) colorCodeDisplay.innerHTML = `<b>Colour-code:</b> 1019${colorCodes[defaultColor]}`;
  if (defaultSizeCheckbox && priceDisplay) {
    const price = defaultSizeCheckbox.dataset.price || '0';
    priceDisplay.textContent = `Ksh ${price}/=`;
  }

  // --- Quantity / Price Calculation ---
  function uncheckOthers(checkbox, group) {
    group.forEach(cb => { if (cb !== checkbox) cb.checked = false; });
  }

  function getSelectedFramePricePerPiece() {
    const selected = qs('.frame-size:checked');
    return selected ? parseFloat(selected.dataset.price || 0) : 0;
  }

  function getSelectedPiecesCount() {
    const selected = qs('#quantity input[type="checkbox"]:checked');
    if (!selected) return 1;
    const label = selected.nextElementSibling?.textContent.trim() || "";
    const match = label.match(/\d+/);
    return match ? parseInt(match[0], 10) : 1;
  }

  function calculateTotalAndUpdateUI() {
    const pricePerPiece = getSelectedFramePricePerPiece();
    const pieces = getSelectedPiecesCount();
    const total = pricePerPiece * pieces;

    if (priceDisplay) priceDisplay.textContent = `Ksh ${total.toLocaleString()}/=`;
    if (frameSizeDisplay && qs('.frame-size:checked')) {
      const size = qs('.frame-size:checked').value;
      frameSizeDisplay.innerHTML = `<b>Frame-size:</b> ${size} (${pieces} pcs)`;
    }
  }

  frameCheckboxes.forEach(cb => {
    cb.addEventListener('change', function() {
      if (this.checked) uncheckOthers(this, frameCheckboxes);
      calculateTotalAndUpdateUI();
    });
  });

  quantityCheckboxes.forEach(cb => {
    cb.addEventListener('change', function() {
      uncheckOthers(this, quantityCheckboxes);
      calculateTotalAndUpdateUI();
    });
  });

  calculateTotalAndUpdateUI();

  // --- Handle Color Changes ---
  colorCheckboxes.forEach(cb => {
    cb.addEventListener('change', function() {
      colorCheckboxes.forEach(other => { if (other !== this) other.checked = false; });
      if (this.checked) {
        const color = this.value;
        const code = colorCodes[color] || "";
        if (colorDisplay) colorDisplay.innerHTML = `<b>Colour:</b> ${color}`;
        if (colorCodeDisplay) colorCodeDisplay.innerHTML = `<b>Colour-code:</b> 1019${code}`;
      }
    });
  });

  // --- CART STORAGE ---
  const readCart = () => JSON.parse(localStorage.getItem('cart') || '[]');
  const writeCart = items => localStorage.setItem('cart', JSON.stringify(items));

  function loadCart() {
    const items = readCart();
    cartContent.innerHTML = '';
    let total = 0;

    items.forEach(item => {
      total += item.price * item.qty;
      const box = document.createElement('div');
      box.className = 'cart-box';
      box.dataset.key = item.key;
      box.innerHTML = `
        <img src="${item.img || ''}" alt="${item.name}">
        <div class="cart-detail">
          <h3 class="cart-product-title">${item.name}</h3>
          <p><small><b>Size:</b> ${item.size}</small></p>
          <p><small><b>Color:</b> ${item.color}</small></p>
          <p class="cart-price" data-price="${item.price}">Ksh ${item.price}</p>
          <div class="cart-quantity">
            <button class="decrement">-</button>
            <span class="number">${item.qty}</span>
            <button class="increment">+</button>
          </div>
        </div>
        <i class="fa-solid fa-trash remove"></i>
      `;
      cartContent.appendChild(box);
    });

    if (totalPriceElement) totalPriceElement.textContent = `Ksh ${total}`;
    const count = items.reduce((s, it) => s + it.qty, 0);
    if (cartCountBadge) {
      cartCountBadge.textContent = count;
      cartCountBadge.style.display = count > 0 ? 'block' : 'none';
    }
  }
  loadCart();

  // --- Cart Open/Close ---
  if (cartIcon && cartEl && overlay) {
    cartIcon.addEventListener('click', () => {
      cartEl.classList.add('active');
      overlay.classList.add('active');
    });
    if (cartClose) cartClose.addEventListener('click', () => {
      cartEl.classList.remove('active');
      overlay.classList.remove('active');
    });
    overlay.addEventListener('click', () => {
      cartEl.classList.remove('active');
      overlay.classList.remove('active');
    });
  }

  // --- Add to Cart ---
  addButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const name = qs('.third-container h1')?.textContent.trim() || 'Product';
      const pricePerPiece = getSelectedFramePricePerPiece();
      const pieces = getSelectedPiecesCount();
      const img = qs('.slide.active')?.src || qs('.slide')?.src || '';
      const size = qs('.frame-size:checked')?.value || defaultSize;
      const color = qs('.frame-color:checked')?.value || defaultColor;
      const key = `${name}___${size}___${color}`;

      let items = readCart();
      const existing = items.find(i => i.key === key);
      if (existing) existing.qty += pieces;
      else items.push({ key, name, size, color, price: pricePerPiece, img, qty: pieces });

      writeCart(items);
      loadCart();

      cartEl.classList.add('active');
      overlay.classList.add('active');
    });
  });

  // --- Cart Actions (increment/decrement/remove) ---
  cartContent.addEventListener('click', e => {
    const btn = e.target;
    const box = btn.closest('.cart-box');
    if (!box) return;
    const key = box.dataset.key;
    let items = readCart();
    const idx = items.findIndex(i => i.key === key);
    if (idx === -1) return;

    if (btn.classList.contains('increment')) items[idx].qty += 1;
    else if (btn.classList.contains('decrement') && items[idx].qty > 1) items[idx].qty -= 1;
    else if (btn.classList.contains('remove') || btn.classList.contains('fa-trash')) items.splice(idx, 1);

    writeCart(items);
    loadCart();
  });

  // --- Accordion Filters ---
  const accordionTriggers = qsa('.accordion-trigger');
  accordionTriggers.forEach(trigger => {
    trigger.addEventListener('click', function() {
      const targetId = this.getAttribute('data-target');
      const content = document.getElementById(targetId);
      const isOpen = content.classList.contains('open');
      content.classList.toggle('open', !isOpen);
      this.classList.toggle('active', !isOpen);
    });
  });

  ['size', 'color', 'material'].forEach(id => {
    const content = document.getElementById(id);
    const trigger = qs(`[data-target="${id}"]`);
    if (content && trigger) {
      content.classList.add('open');
      trigger.classList.add('active');
    }
  });

  // --- Delivery Details Auto-Save ---
  const nameField = qs('#deliveryName');
  const phoneField = qs('#deliveryPhone');
  const addressField = qs('#deliveryAddress');
  if (nameField && phoneField && addressField) {
    const saved = {
      name: localStorage.getItem('deliveryName'),
      phone: localStorage.getItem('deliveryPhone'),
      address: localStorage.getItem('deliveryAddress'),
    };
    if (saved.name) nameField.value = saved.name;
    if (saved.phone) phoneField.value = saved.phone;
    if (saved.address) addressField.value = saved.address;

    [nameField, phoneField, addressField].forEach(input => {
      input.addEventListener('input', () => {
        localStorage.setItem(input.id, input.value.trim());
      });
    });
  }

  // --- WhatsApp Buy Now ---
  const buyNowBtn = qs('#buyNow');
  if (buyNowBtn) {
    buyNowBtn.addEventListener('click', () => {
      let message = "🖼 *New Frame Order Request*%0A%0A";
      const items = readCart();
      const deliveryName = qs('#deliveryName')?.value.trim();
      const deliveryPhone = qs('#deliveryPhone')?.value.trim();
      const deliveryAddress = qs('#deliveryAddress')?.value.trim();

      if (items.length === 0) {
        // No cart: fallback single frame
        const name = qs('.third-container h1')?.textContent.trim() || 'Product';
        const frameSize = qs('#frameSize')?.textContent.replace('Frame-size:', '').trim() || '';
        const frameColor = qs('#frameColor')?.textContent.replace('Colour:', '').trim() || '';
        const totalPrice = qs('#price')?.textContent.trim() || '0';
        const quantity = getSelectedPiecesCount();

        message += `Type of Item: ${name}%0A`;
        message += `Frame Size: ${frameSize}%0A`;
        message += `Colour: ${frameColor}%0A`;
        message += `Quantity: ${quantity} pcs%0A`;
        message += `Total Price: ${totalPrice}%0A%0A`;
      } else {
        let grandTotal = 0;
        items.forEach(it => {
          const subtotal = it.price * it.qty;
          grandTotal += subtotal;
          message += `Type of Item: ${it.name}%0A`;
          message += `Frame Size: ${it.size}%0A`;
          message += `Colour: ${it.color}%0A`;
          message += `Quantity: ${it.qty} pcs%0A`;
          message += `Total Price: Ksh ${subtotal}/=%0A%0A`;
        });
        message += `Grand Total: Ksh ${grandTotal}/=%0A%0A`;
      }

      if (deliveryName || deliveryPhone || deliveryAddress) {
        message += `*Delivery Details*:%0A`;
        if (deliveryName) message += `👤 Name: ${deliveryName}%0A`;
        if (deliveryPhone) message += `📞 Phone: ${deliveryPhone}%0A`;
        if (deliveryAddress) message += `🏠 Address: ${deliveryAddress}%0A`;
        message += `%0AThank You! 🙏`;
      } else {
        message += `Thank You! 🙏`;
      }

      const phoneNumber = "254791488487";
      window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    });
  }

  // --- WhatsApp Checkout ---
  const checkoutBtn = qs('#checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', e => {
      e.preventDefault();
      const items = readCart();
      if (items.length === 0) return alert("Your cart is empty!");

      let message = "🛒 *Checkout Order from FrameMuse!*%0A%0A";
      let total = 0;
      items.forEach((item, i) => {
        const sub = item.price * item.qty;
        total += sub;
        message += `*${i + 1}. ${item.name}*%0A`;
        message += ` - Size: ${item.size}%0A`;
        message += ` - Colour: ${item.color}%0A`;
        message += ` - Quantity: ${item.qty}%0A`;
        message += ` - Price (each): Ksh ${item.price}%0A`;
        message += ` - Subtotal: Ksh ${sub}%0A%0A`;
      });
      message += `🧾 *Total Amount:* Ksh ${total}/=%0A%0A`;

      const deliveryName = qs('#deliveryName')?.value.trim();
      const deliveryPhone = qs('#deliveryPhone')?.value.trim();
      const deliveryAddress = qs('#deliveryAddress')?.value.trim();

      if (deliveryName || deliveryPhone || deliveryAddress) {
        message += `*Delivery Details*:%0A`;
        if (deliveryName) message += `👤 Name: ${deliveryName}%0A`;
        if (deliveryPhone) message += `📞 Phone: ${deliveryPhone}%0A`;
        if (deliveryAddress) message += `🏠 Address: ${deliveryAddress}%0A`;
      }

      message += `%0AThank you for shopping with FrameMuse! 🙏`;

      const phoneNumber = "254791488487";
      window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    });
  }
});


// --- Add to Cart From Listing Page (Cart Icon Click) ---
const listingCartIcons = qsa('.frame-container .fa-cart-shopping');

listingCartIcons.forEach(icon => {
  icon.addEventListener('click', e => {
    e.preventDefault(); // Prevent <a> from navigating

    const card = icon.closest('.frame-container');
    if (!card) return;

    // Extract available data from listing page
    const name = card.querySelector('h4')?.textContent.trim() || "Frame";
    const img = card.querySelector('img')?.src || "";

    // Default values
    const size = "5 x 7";
    const color = "Black";
    const price = 350;
    const qty = 1;

    // Unique key (same format used in product pages)
    const key = `${name}___${size}___${color}`;

    let items = readCart();
    const existing = items.find(i => i.key === key);

    if (existing) {
      // If item already exists, increase quantity
      existing.qty += qty;
    } else {
      // Add new item with default values
      items.push({
        key,
        name,
        size,
        color,
        price,
        img,
        qty
      });
    }

    // Update cart and UI
    writeCart(items);
    loadCart();

    // Open the cart popup
    cartEl.classList.add('active');
    overlay.classList.add('active');
  });
});

 
 