export interface IArticle {
  id: number;
  title: string;
  contents: string | null;
  view_cnt: number;
  ip_addres?: string;
  created_at: string;
  created_member_id: number;
}
