import { useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useAuthStatus } from './useAuthStatus';

/**
 * 自动登录默认账号的hook
 * 根据环境变量配置决定是否自动登录默认账号
 */
export function useAutoLogin() {
  const { status } = useAuthStatus();
  const { data: session } = useSession();

  useEffect(() => {
    console.log('=== 自动登录检查开始 ===');
    console.log('当前认证状态:', status);
    console.log('当前会话:', session?.user?.email || '未登录');
    
    // 检查是否启用了自动登录功能
    const enableAutoLogin = process.env.NEXT_PUBLIC_ENABLE_AUTO_LOGIN === 'true';
    console.log('自动登录功能启用状态:', enableAutoLogin);
    console.log('环境变量 ENABLE_AUTO_LOGIN 值:', process.env.NEXT_PUBLIC_ENABLE_AUTO_LOGIN);
    
    // 如果没有启用自动登录，直接返回
    if (!enableAutoLogin) {
      console.log('自动登录未启用，跳过');
      return;
    }

    // 如果已经登录，不需要自动登录
    if (status === 'authenticated' && session?.user) {
      console.log('用户已登录，邮箱:', session.user.email);
      console.log('已登录用户无需自动登录');
      return;
    }

    // 如果正在加载认证状态，等待加载完成
    if (status === 'loading') {
      console.log('认证状态加载中，等待完成...');
      return;
    }

    // 获取默认登录凭据
    const defaultEmail = process.env.NEXT_PUBLIC_DEFAULT_LOGIN_EMAIL;
    const defaultPassword = process.env.NEXT_PUBLIC_DEFAULT_LOGIN_PASSWORD;
    
    console.log('默认登录邮箱:', defaultEmail);
    console.log('默认登录密码:', defaultPassword ? '[已配置]' : '[未配置]');

    // 验证必要配置是否存在
    if (!defaultEmail || !defaultPassword) {
      console.warn('❌ 自动登录配置不完整，请检查NEXT_PUBLIC_DEFAULT_LOGIN_EMAIL和NEXT_PUBLIC_DEFAULT_LOGIN_PASSWORD环境变量');
      return;
    }

    console.log('✅ 自动登录配置完整，准备执行自动登录...');
    
    // 执行自动登录
    const autoLogin = async () => {
      try {
        console.log('🚀 开始自动登录默认账号...');
        console.log('登录邮箱:', defaultEmail);
        
        const result = await signIn('credentials', {
          email: defaultEmail,
          password: defaultPassword,
          redirect: false, // 不重定向，保持在当前页面
        });

        console.log('登录结果:', result);
        
        if (result?.error) {
          console.error('❌ 自动登录失败:', result.error);
        } else if (result?.ok) {
          console.log('✅ 自动登录成功');
        } else {
          console.log('⚠️ 登录结果异常:', result);
        }
      } catch (error) {
        console.error('❌ 自动登录过程中发生错误:', error);
      }
    };

    // 延迟执行自动登录，确保应用完全初始化
    console.log('⏰ 设置1秒后执行自动登录...');
    const timer = setTimeout(() => {
      console.log('⏰ 延迟时间到，执行自动登录');
      autoLogin();
    }, 1000);

    // 清理定时器
    return () => {
      console.log('🧹 清理自动登录定时器');
      clearTimeout(timer);
    };
  }, [status, session]);
}