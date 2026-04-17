import Order from "../models/Order.js";

// @desc Create new order
// @route POST /api/orders
export const createOrder = async (req, res) => {
  try {
    const { customer, items, totalAmount } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items in order" });
    }

    const orderPayload = {
      customer,
      items,
      totalAmount,
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
