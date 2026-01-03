# Supabase 实时订阅功能使用指南

## 概述

Supabase 提供了实时数据订阅功能，允许前端应用实时接收数据库变更通知。本指南将介绍如何在前端应用中实现实时订阅功能。

## 基本概念

- **订阅（Subscription）**：监听特定表的变更事件
- **变更事件**：INSERT、UPDATE、DELETE
- **过滤器**：可以根据条件过滤订阅的事件

## 实现步骤

### 1. 安装 Supabase 客户端

```bash
npm install @supabase/supabase-js
```

### 2. 初始化 Supabase 客户端

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);
```

### 3. 订阅清单变更

```javascript
// 订阅共享清单的变更
const listSubscription = supabase
  .channel('shared-lists')
  .on(
    'postgres_changes',
    {
      event: '*', // 监听所有变更事件（INSERT、UPDATE、DELETE）
      schema: 'public',
      table: 'shared_lists',
      filter: 'owner_id=eq.{{user_id}}' // 只监听当前用户的清单
    },
    (payload) => {
      console.log('清单变更:', payload);
      // 更新前端UI
      updateListsUI();
    }
  )
  .subscribe();

// 订阅清单项目的变更
const itemSubscription = supabase
  .channel('list-items')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'list_items',
      filter: 'list_id=eq.{{list_id}}' // 只监听特定清单的项目
    },
    (payload) => {
      console.log('清单项目变更:', payload);
      // 更新前端UI
      updateItemsUI();
    }
  )
  .subscribe();
```

### 4. 取消订阅

```javascript
// 取消订阅
listSubscription.unsubscribe();
itemSubscription.unsubscribe();
```

## 错误处理

```javascript
try {
  const subscription = supabase
    .channel('shared-lists')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'shared_lists'
    }, (payload) => {
      console.log('变更:', payload);
    })
    .subscribe();
} catch (error) {
  console.error('订阅失败:', error);
}
```

## 最佳实践

1. **限制订阅范围**：使用过滤器只订阅必要的数据
2. **及时取消订阅**：在组件卸载时取消订阅，避免内存泄漏
3. **批量更新**：如果有大量变更，可以考虑批量更新UI，避免频繁重新渲染
4. **错误处理**：添加适当的错误处理，确保应用稳定性

## 示例应用

以下是一个完整的示例，展示如何在 React 组件中使用实时订阅：

```javascript
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
);

function SharedLists() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);

  // 获取初始数据
  const fetchLists = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shared_lists')
        .select('*');

      if (error) throw error;
      setLists(data);
    } catch (error) {
      console.error('获取清单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 设置实时订阅
  useEffect(() => {
    fetchLists();

    // 订阅清单变更
    const subscription = supabase
      .channel('shared-lists')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shared_lists'
      }, (payload) => {
        console.log('清单变更:', payload);
        // 根据变更类型更新本地状态
        if (payload.eventType === 'INSERT') {
          setLists([...lists, payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          setLists(lists.map(list => 
            list.id === payload.new.id ? payload.new : list
          ));
        } else if (payload.eventType === 'DELETE') {
          setLists(lists.filter(list => list.id !== payload.old.id));
        }
      })
      .subscribe();

    // 组件卸载时取消订阅
    return () => {
      subscription.unsubscribe();
    };
  }, [lists]);

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <h1>共享清单</h1>
      <ul>
        {lists.map(list => (
          <li key={list.id}>
            <h2>{list.name}</h2>
            <p>{list.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SharedLists;
```