// 处理头像URL的工具函数
export const getAvatarUrl = (avatar: string | undefined): string | undefined => {
  if (!avatar) return undefined;
  if (avatar.startsWith('http')) return avatar;
  return `http://localhost:5000${avatar}`;
};
