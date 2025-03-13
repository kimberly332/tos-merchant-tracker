// src/components/cart/ShoppingCart.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { checkUserAuth } from '../../firebase/userAuth';
import { updateUserCart } from '../../firebase/userAuth';
import './ShoppingCart.css';

const ShoppingCart = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [cartItems, setCartItems] = useState([]);
    const [user, setUser] = useState(null);

    // Memoized calculation of total coins and required materials
    const { totalCoins, requiredMaterials } = useMemo(() => {
        let coins = 0;
        let materials = {};

        // 新增一個篩選條件，確保只計算有販售的商品
        const validCartItems = cartItems.filter(item => item.quantity > 0 && item.availableQuantity > 0);

        validCartItems.forEach(item => {
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

    // 移除對空購物車的持久化
    const loadCartFromLocalStorage = useCallback(() => {
        try {
            const savedCart = localStorage.getItem('shoppingCart');
            const cart = savedCart ? JSON.parse(savedCart) : [];
            
            // 更寬鬆的篩選條件
            const validCart = cart.filter(item => 
                item && 
                item.itemName && 
                item.playerId && 
                (item.quantity || 0) > 0 && 
                (item.availableQuantity || 0) > 0
            );
            
            return validCart;
        } catch (error) {
            console.error('Error loading cart from localStorage:', error);
            return [];
        }
    }, []);

    // Initialize user and cart
    useEffect(() => {
        const currentUser = checkUserAuth();
        setUser(currentUser);

        // 只要有用戶就嘗試加載購物車
        if (currentUser) {
            const initialCart = loadCartFromLocalStorage();
            
            // 始終設置購物車，即使為空
            setCartItems(initialCart);

            // 觸發購物車更新事件，確保其他組件知道購物車狀態
            const cartUpdatedEvent = new CustomEvent('cartUpdated', {
                detail: { cart: initialCart }
            });
            window.dispatchEvent(cartUpdatedEvent);
        }
    }, []); 

    // Handle cart persistence and synchronization
    useEffect(() => {
        // 只要有用戶，就持久化購物車
        if (user) {
            try {
                // 篩選出有效的購物車商品
                const validCartItems = cartItems.filter(item => 
                    item && 
                    item.itemName && 
                    item.playerId && 
                    (item.quantity || 0) > 0 && 
                    (item.availableQuantity || 0) > 0
                );

                // 儲存所有有效商品
                if (validCartItems.length > 0) {
                    localStorage.setItem('shoppingCart', JSON.stringify(validCartItems));
                    updateUserCart(user.userId, validCartItems);
                } else {
                    // 如果沒有有效商品，也清除 localStorage
                    localStorage.removeItem('shoppingCart');
                }

                // 通知其他元件
                const cartUpdatedEvent = new CustomEvent('cartUpdated', {
                    detail: { cart: validCartItems }
                });
                window.dispatchEvent(cartUpdatedEvent);
            } catch (error) {
                console.error('Error saving cart:', error);
            }
        }
    }, [cartItems, user]); 

    // 穩定的事件處理器
    const handleAddToCart = useCallback((event) => {
        const newItem = event.detail;

        setCartItems(prevItems => {
            // 檢查是否已存在
            const existingItemIndex = prevItems.findIndex(item =>
                item.itemName === newItem.itemName &&
                item.playerId === newItem.playerId
            );

            if (existingItemIndex >= 0) {
                // 更新現有商品數量
                const updatedItems = [...prevItems];
                const currentItem = updatedItems[existingItemIndex];

                // 尊重可用數量限制
                const maxQuantity = currentItem.availableQuantity || 1;
                updatedItems[existingItemIndex] = {
                    ...currentItem,
                    quantity: Math.min(currentItem.quantity + 1, maxQuantity)
                };

                return updatedItems;
            } else {
                // 只在有可用數量時添加新商品
                if (newItem.availableQuantity > 0) {
                    return [...prevItems, { ...newItem, quantity: 1 }];
                }
                return prevItems;
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

    // 添加和移除事件監聽器
    useEffect(() => {
        window.addEventListener('addToCart', handleAddToCart);
        window.addEventListener('removeFromCart', handleRemoveFromCart);

        return () => {
            window.removeEventListener('addToCart', handleAddToCart);
            window.removeEventListener('removeFromCart', handleRemoveFromCart);
        };
    }, [handleAddToCart, handleRemoveFromCart]);

    // 切換購物車
    const toggleCart = () => {
        setIsOpen(!isOpen);
    };

    // 移除商品
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

    // 更新商品數量
    const updateQuantity = (index, newQuantity) => {
        if (newQuantity < 1) {
            // 如果數量小於1，直接移除商品
            removeFromCart(index);
            return;
        }

        setCartItems(prevItems => {
            const updatedItems = [...prevItems];
            const item = updatedItems[index];

            // 尊重可用數量限制
            const availableQuantity = item.availableQuantity || 1;
            updatedItems[index] = {
                ...item,
                quantity: Math.min(newQuantity, availableQuantity)
            };

            return updatedItems;
        });
    };

    // 清空購物車
    const clearCart = () => {
        setCartItems([]);
        
        const cartUpdatedEvent = new CustomEvent('cartUpdated', {
            detail: { cart: [] }
        });
        window.dispatchEvent(cartUpdatedEvent);
    };

    // 如果沒有用戶，不渲染購物車
    if (!user) {
        return null;
    }

    // 過濾有效的購物車商品
    const validCartItems = cartItems.filter(item => item.quantity > 0 && item.availableQuantity > 0);

    return (
        <div className="shopping-cart-container">
            <button
                className="cart-icon"
                onClick={toggleCart}
                aria-label="購物車"
            >
                <i className="fas fa-shopping-cart"></i>
                {validCartItems.length > 0 && (
                    <span className="cart-badge">
                        {validCartItems.reduce((total, item) => total + item.quantity, 0)}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className={`cart-panel ${isOpen ? 'open' : ''}`}>
                    <div className="cart-header">
                        <h3>購物車</h3>
                        <button className="close-cart" onClick={toggleCart}>×</button>
                    </div>

                    {validCartItems.length === 0 ? (
                        <div className="empty-cart">
                            <p>購物車是空的</p>
                            <p className="empty-cart-help">點擊商品將其添加到購物車</p>
                        </div>
                    ) : (
                        <>
                            <div className="cart-items">
                                {validCartItems.map((item, index) => (
                                    <div key={index} className="cart-item">
                                        {/* 之前的購物車商品渲染代碼 */}
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
                                                    disabled={item.quantity >= (item.availableQuantity || 1)}
                                                    title={`最多可購買 ${item.availableQuantity || 1} 個`}
                                                >+</button>
                                            </div>
                                            <div className="quantity-limit">
                                                數量: {item.quantity}/{item.availableQuantity || 1} 個
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
                                    <span className="summary-value">{validCartItems.reduce((total, item) => total + item.quantity, 0)} 件</span>
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