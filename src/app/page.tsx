"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';

type Product = {
  prd_id: number;
  code: string;
  name: string;
  price: number;
};

type CartItem = Product & { quantity: number };

// バックエンドのモデルと一致する型定義
type PurchaseItem = {
  prd_id: number;
  prd_code: string;
  prd_name: string;
  prd_price: number;
};

type PurchaseRequest = {
  emp_cd: string;
  store_cd: string;
  pos_no: string;
  items: PurchaseItem[];
};

// 例：購入APIのレスポンス型を定義
type PurchaseResponse = { success: boolean; total_amt: number };

export default function Home() {
  const [code, setCode] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [purchaseMessage, setPurchaseMessage] = useState('');

  // 商品コード読み込み処理
  const handleReadProduct = async () => {
    setError('');
    setProduct(null);
    try {
      const res = await axios.get<Product>(`http://localhost:8000/api/products/${code}`);
      setProduct(res.data);
    } catch (e) {
      setError('商品が見つかりません');
    }
  };

  // 購入リストに商品を追加する処理
  const handleAddToCart = () => {
    if (!product) return;
    const newItem: CartItem = { ...product, quantity: 1 };
    setCart([...cart, newItem]);
    setProduct(null); // 追加後、商品表示をクリア
    setCode(''); // 入力欄もクリア
  };

  // 購入リスト内の商品の数量を変更する処理
  const handleQuantityChange = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return; // 数量は1以上
    const newCart = [...cart];
    newCart[index].quantity = newQuantity;
    setCart(newCart);
  };

  // 購入リストから商品を削除する処理
  const handleRemoveItem = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
  };

  // 購入処理（購入ボタンクリック時）
  const handlePurchase = async () => {
    if (cart.length === 0) {
      setError('購入リストが空です');
      return;
    }
    setError('');
    setPurchaseMessage('');
    
    // カートの商品をバックエンドの期待する形式に変換
    const items: PurchaseItem[] = cart.map(item => ({
      prd_id: item.prd_id,
      prd_code: item.code,
      prd_name: item.name,
      prd_price: item.price
    }));

    const req: PurchaseRequest = {
      emp_cd: 'A001',
      store_cd: '00001',
      pos_no: '001',
      items: items
    };

    console.log('購入リクエスト:', req); // デバッグ用ログ

    try {
      const res = await axios.post<PurchaseResponse>('http://localhost:8000/api/purchase', req);
      if (res.data.success) {
        setPurchaseMessage(`購入完了！合計金額: ${res.data.total_amt}円`);
        setCart([]); // 購入リストをクリア
      } else {
         setError('購入処理に失敗しました');
      }
    } catch (e) {
       setError('購入処理に失敗しました');
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // 商品コード入力の自動フォーカス
  useEffect(() => {
    const input = document.getElementById('product-code-input');
    if (input) {
      input.focus();
    }
  }, []);

  // Enterキーで商品読み込み
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleReadProduct();
    }
  };

  return (
    <div className="air-pos-container">
      <div>
        <div className="air-pos-card" style={{ marginBottom: '1rem' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>Tech POS</h1>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              id="product-code-input"
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="商品コードを入力"
              className="air-pos-input"
              style={{ flex: 1 }}
            />
            <button onClick={handleReadProduct} className="air-pos-button air-pos-button-primary">
              読み込み
            </button>
          </div>
          {error && <div className="air-pos-error">{error}</div>}
          {purchaseMessage && <div className="air-pos-success">{purchaseMessage}</div>}
        </div>

        {product && (
          <div className="air-pos-card" style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>商品情報</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{product.name}</div>
                <div style={{ color: 'var(--text-color)', opacity: 0.8 }}>商品コード: {product.code}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                  {product.price.toLocaleString()}円
                </div>
                <button onClick={handleAddToCart} className="air-pos-button air-pos-button-success" style={{ marginTop: '0.5rem' }}>
                  カートに追加
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="air-pos-card" style={{ height: 'fit-content' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          購入リスト
        </h2>
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-color)', opacity: 0.6 }}>
            商品を追加してください
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '1rem' }}>
              {cart.map((item, index) => (
                <div key={index} className="air-pos-cart-item">
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-color)', opacity: 0.8 }}>
                      単価: {item.price.toLocaleString()}円
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(index, Number(e.target.value))}
                      className="air-pos-quantity-input"
                    />
                    <div style={{ minWidth: '100px', textAlign: 'right' }}>
                      {(item.price * item.quantity).toLocaleString()}円
                    </div>
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="air-pos-button air-pos-button-danger"
                      style={{ padding: '0.5rem' }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '2px solid var(--border-color)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>合計金額</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                  {totalAmount.toLocaleString()}円
                </div>
              </div>
              <button
                onClick={handlePurchase}
                className="air-pos-button air-pos-button-success"
                style={{ width: '100%', fontSize: '1.1rem' }}
              >
                購入する
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
