// src/components/cart/ShoppingCart.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { checkUserAuth } from '../../firebase/userAuth';
import { updateUserCart } from '../../firebase/userAuth';
import './ShoppingCart.css';

const ShoppingCart = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [cartItems, setCartItems] = useState([]);
    const [user, setUser] = useState(null);
    const [merchantsExist, setMerchantsExist] = useState(true);

    // Memoized calculation of total coins and required materials
    const { totalCoins, requiredMaterials } = useMemo(() => {
        let coins = 0;
        let materials = {};

        // Calculate for all cart items, regardless of availability
        cartItems.forEach(item => {
            if (item.allowsCoinExchange && item.price) {
                coins += item.price * item.quantity;
            }

            if (item.allowsBarterExchange && item.exchangeItemName) {
                const materialName = item.exchangeItemName;
                const materialQty = (item.exchangeQuantity || 1) * item.quantity;

                materials[materialName] = (materials[materialName] || 0) + materialQty;
            }
        });

        return { totalCoins: coins, requiredMaterials: materials };
    }, [cartItems]);

    // Check for merchants existence
    const checkMerchantsExistence = useCallback((event) => {
        if (event.detail && event.detail.hasNoMerchants !== undefined) {
            setMerchantsExist(!(event.detail.hasNoMerchants));
        }
    }, []);

    // Listen for merchant existence event
    useEffect(() => {
        window.addEventListener('merchantsExistence', checkMerchantsExistence);
        return () => {
            window.removeEventListener('merchantsExistence', checkMerchantsExistence);
        };
    }, [checkMerchantsExistence]);

    // Load cart from localStorage
    const loadCartFromLocalStorage = useCallback(() => {
        try {
            const savedCart = localStorage.getItem('shoppingCart');
            return savedCart ? JSON.parse(savedCart) : [];
        } catch (error) {
            console.error('Error loading cart from localStorage:', error);
            return [];
        }
    }, []);

    // Initialize user and cart
    useEffect(() => {
        const currentUser = checkUserAuth();
        setUser(currentUser);

        // Always load cart for logged-in user
        if (currentUser) {
            const initialCart = loadCartFromLocalStorage();
            setCartItems(initialCart);

            // Trigger cart update event
            const cartUpdatedEvent = new CustomEvent('cartUpdated', {
                detail: { cart: initialCart }
            });
            window.dispatchEvent(cartUpdatedEvent);
        }
    }, []);

    // Handle cart persistence and synchronization
    useEffect(() => {
        if (user) {
            try {
                // Save entire cart to localStorage
                localStorage.setItem('shoppingCart', JSON.stringify(cartItems));
                updateUserCart(user.userId, cartItems);

                // Notify other components
                const cartUpdatedEvent = new CustomEvent('cartUpdated', {
                    detail: { cart: cartItems }
                });
                window.dispatchEvent(cartUpdatedEvent);
            } catch (error) {
                console.error('Error saving cart:', error);
            }
        }
    }, [cartItems, user]);

    // Stable event handlers
    const handleAddToCart = useCallback((event) => {
        const newItem = event.detail;

        setCartItems(prevItems => {
            // Check if item already exists
            const existingItemIndex = prevItems.findIndex(item =>
                item.itemName === newItem.itemName &&
                item.playerId === newItem.playerId
            );

            if (existingItemIndex >= 0) {
                // Update existing item's quantity
                const updatedItems = [...prevItems];
                const currentItem = updatedItems[existingItemIndex];

                // Increment quantity
                updatedItems[existingItemIndex] = {
                    ...currentItem,
                    quantity: (currentItem.quantity || 0) + 1
                };

                return updatedItems;
            } else {
                // Add new item with quantity 1
                return [...prevItems, { ...newItem, quantity: 1 }];
            }
        });
    }, []);

    const handleRemoveFromCart = useCallback((event) => {
        const itemToRemove = event.detail;

        setCartItems(prevItems =>
            prevItems.filter(
                item => !(item.itemName === itemToRemove.itemName &&
                    item.playerId === itemToRemove.playerId)
            )
        );
    }, []);

    // Add and remove event listeners
    useEffect(() => {
        window.addEventListener('addToCart', handleAddToCart);
        window.addEventListener('removeFromCart', handleRemoveFromCart);

        return () => {
            window.removeEventListener('addToCart', handleAddToCart);
            window.removeEventListener('removeFromCart', handleRemoveFromCart);
        };
    }, [handleAddToCart, handleRemoveFromCart]);

    // Toggle cart
    const toggleCart = () => {
        setIsOpen(!isOpen);
    };

    // Remove item from cart
    const removeFromCart = (index) => {
        setCartItems(prevItems => {
            const updatedItems = [...prevItems];
            const removedItem = updatedItems[index];

            updatedItems.splice(index, 1);

            const removeEvent = new CustomEvent('removeFromCart', {
                detail: {
                    itemName: removedItem.itemName,
                    playerId: removedItem.playerId
                }
            });
            window.dispatchEvent(removeEvent);

            return updatedItems;
        });
    };

    // Update item quantity
    const updateQuantity = (index, newQuantity) => {
        if (newQuantity < 1) {
            // If quantity is less than 1, remove the item
            removeFromCart(index);
            return;
        }

        setCartItems(prevItems => {
            const updatedItems = [...prevItems];
            const item = updatedItems[index];

            // Ensure quantity doesn't exceed purchaseTimes
            const purchaseTimes = item.purchaseTimes || 1;
            updatedItems[index] = {
                ...item,
                quantity: Math.min(newQuantity, purchaseTimes)
            };

            return updatedItems;
        });
    };
    // Clear cart
    const clearCart = () => {
        setCartItems([]);

        const cartUpdatedEvent = new CustomEvent('cartUpdated', {
            detail: { cart: [] }
        });
        window.dispatchEvent(cartUpdatedEvent);
    };

    // Cart always renders, but content changes based on merchants' existence
    return (
        <div className="shopping-cart-container">
            <button
                className="cart-icon"
                onClick={toggleCart}
                aria-label="購物車"
            >
                {merchantsExist && cartItems.length > 0 && (
                    <span className="cart-badge">
                        {cartItems.reduce((total, item) => total + item.quantity, 0)}
                    </span>
                )}
                <i className="fas fa-shopping-cart"></i>
            </button>

            {isOpen && user && (
                <div className={`cart-panel ${isOpen ? 'open' : ''}`}>
                    <div className="cart-header">
                        <h3>購物車</h3>
                        <button className="close-cart" onClick={toggleCart}>×</button>
                    </div>

                    {!merchantsExist ? (
                        <div className="empty-cart">
                            <p>目前沒有商人資訊</p>
                            <p className="empty-cart-help">請先新增商人</p>
                        </div>
                    ) : cartItems.length === 0 ? (
                        <div className="empty-cart">
                            <p>購物車是空的</p>
                            <p className="empty-cart-help">點擊商品將其添加到購物車</p>
                        </div>
                    ) : (
                        <>
                            <div className="cart-items">
                                {cartItems.map((item, index) => (
                                    <div key={index} className="cart-item">
                                        <div className="cart-item-details">
                                            <div className="cart-item-name">{item.itemName}</div>
                                            <div className="cart-item-seller">賣家: {item.playerId}</div>
                                            <div className="cart-item-exchange">
                                                {item.allowsCoinExchange && (
                                                    <span className="cart-item-price">💰 {item.price} 枚</span>
                                                )}
                                                {item.allowsBarterExchange && (
                                                    <span className="cart-item-exchange-material">
                                                        🔄 {item.exchangeQuantity || 1} 個 {item.exchangeItemName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="cart-item-actions">
                                            <div className="quantity-control">
                                                <button
                                                    onClick={() => updateQuantity(index, item.quantity - 1)}
                                                    disabled={item.quantity <= 1}
                                                >-</button>
                                                <span>{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(index, item.quantity + 1)}
                                                    disabled={item.quantity >= (item.purchaseTimes || 1)}
                                                    title={`最多可購買 ${item.purchaseTimes || 1} 個`}
                                                >+</button>
                                            </div>
                                            <div className="quantity-limit">
                                                數量: {item.quantity}/{item.purchaseTimes || 1} 個
                                            </div>
                                            <button
                                                className="remove-item"
                                                onClick={() => removeFromCart(index)}
                                            >
                                                <i className="fas fa-trash-alt"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="cart-summary">
                                <h4>總計:</h4>
                                {totalCoins > 0 && (
                                    <div className="summary-item">
                                        <span className="summary-label">需要家園幣:</span>
                                        <span className="summary-value">💰 {totalCoins.toLocaleString()} 枚</span>
                                    </div>
                                )}

                                {Object.keys(requiredMaterials).length > 0 && (
                                    <div className="materials-list">
                                        <h5>需要交換材料:</h5>
                                        {Object.entries(requiredMaterials).map(([material, quantity]) => (
                                            <div key={material} className="summary-item">
                                                <span className="summary-label">{material}:</span>
                                                <span className="summary-value">{quantity.toLocaleString()} 個</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="cart-item-count">
                                    <span className="summary-label">購物車商品總數:</span>
                                    <span className="summary-value">{cartItems.reduce((total, item) => total + item.quantity, 0)} 件</span>
                                </div>

                                <button className="clear-cart" onClick={clearCart}>
                                    清空購物車
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default ShoppingCart;