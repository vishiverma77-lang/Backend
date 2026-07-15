import Order from "../models/Order.js";

// @desc Create new order
// @route POST /api/orders
export const createOrder = async (req, res) => {
  try {
    const { customer, items, totalAmount, deliveryCharge, distance } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items in order" });
    }

    // Sanitize product IDs by removing variation suffixes
    const sanitizedItems = items.map(item => {
      let prodId = item.productId;
      if (typeof prodId === 'string' && prodId.includes('-')) {
        prodId = prodId.split('-')[0];
      }
      return {
        ...item,
        productId: prodId
      };
    });

    const orderPayload = {
      customer,
      items: sanitizedItems,
      totalAmount,
      deliveryCharge: deliveryCharge || 0,
      distance: distance || 0,
    };
    
    if (req.body.userId) {
       orderPayload.userId = req.body.userId;
    }

    const order = new Order(orderPayload);

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Server error creating order" });
  }
};

// @desc Get all orders
// @route GET /api/orders
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Server error fetching orders" });
  }
};

// @desc Update order status
// @route PUT /api/orders/:id/status
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    
    // Build update object dynamically
    const updateFields = { status };
    if (adminNote !== undefined) {
      updateFields.adminNote = adminNote;
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Server error updating status" });
  }
};

// @desc Delete order
// @route DELETE /api/orders/:id
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ message: "Server error deleting order" });
  }
};

// @desc Get orders for logged in user
// @route GET /api/orders/my-orders
export const getMyOrders = async (req, res) => {
  try {
    // SECURITY: Only fetch orders linked to this specific user's ID
    // Never use phone number matching as it could expose other users' orders
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ message: "Server error fetching user orders" });
  }
};

// @desc Calculate delivery charge based on pincode
// @route POST /api/orders/calculate-delivery
export const calculateDelivery = async (req, res) => {
  try {
    const { customerPincode, totalWeight = 0 } = req.body;
    const warehousePincode = process.env.WAREHOUSE_PINCODE || "363641";

    if (!customerPincode) {
      return res.status(400).json({ message: "Customer pincode is required" });
    }

    if (customerPincode === warehousePincode) {
       return res.json({ distance: 0, deliveryCharge: 0 });
    }
    
    const fetchCoords = async (pincode) => {
       const url = `https://nominatim.openstreetmap.org/search?postalcode=${pincode}&country=india&format=json`;
       const response = await fetch(url, { headers: { 'User-Agent': 'CeragresBackend/1.0' }});
       const data = await response.json();
       if (data && data.length > 0) {
          return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
       }
       return null;
    };

    const warehouseCoords = await fetchCoords(warehousePincode);
    const customerCoords = await fetchCoords(customerPincode);

    if (!warehouseCoords || !customerCoords) {
       // Fallback if pincode not found exactly, estimate high so they contact support
       return res.json({ distance: 100, deliveryCharge: Math.max(500, 6 * totalWeight), note: "Estimated" });
    }

    // Haversine formula
    const R = 6371; // km
    const dLat = (customerCoords.lat - warehouseCoords.lat) * Math.PI / 180;
    const dLon = (customerCoords.lon - warehouseCoords.lon) * Math.PI / 180;
    const lat1 = warehouseCoords.lat * Math.PI / 180;
    const lat2 = customerCoords.lat * Math.PI / 180;

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    let distance = Math.round(R * c);

    // Charge Formula based on weight and distance tiers
    let ratePerKg = 0;
    if (distance <= 500) ratePerKg = 4;
    else if (distance <= 1000) ratePerKg = 6;
    else if (distance <= 1500) ratePerKg = 8;
    else if (distance <= 2000) ratePerKg = 10;
    else if (distance <= 2500) ratePerKg = 12;
    else if (distance <= 3000) ratePerKg = 14;
    else ratePerKg = 15;

    let deliveryCharge = ratePerKg * totalWeight;

    res.json({ distance, deliveryCharge });

  } catch (error) {
    console.error("Error calculating delivery:", error);
    res.status(500).json({ message: "Server error calculating delivery" });
  }
};
