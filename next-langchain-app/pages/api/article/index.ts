// 호출주소: http://localhost:3000/api/article
// 제공기능: 게시글 정보관리 RESTAPI 기능제공 모듈

//NextApiRequest 타입는 웹브라우저에서 서버로 전달되는 각종 정보를 추출하는 HTTPRequest 객체=req
//NextApiResponse 타입은 서버에서 웹브라우저로 전달하는 응답처리를 위한 HttpResponse 객체=res
import type { NextApiRequest, NextApiResponse } from "next";

import { IArticle } from "@/interfaces/article";

//서버에서 웹브라우저로 반환하는 처리결과 데이터 타입
type ResponseData = {
  code: number;
  data: string | null | IArticle[] | IArticle;
  msg: string;
};

//해당 업무(Hello)에 대한 C/R/U/D 처리를 위한 RESTFul API 기능구현 핸들러 함수
//하나의 함수로 해당업무의 모든 라우팅방식을 통합해서 기능을 제공하는 통합 라우팅 함수
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  //API 호출 기본 결과값 설정
  let apiResult: ResponseData = {
    code: 400,
    data: null,
    msg: "Failed",
  };

  try {
    //클라이언트에서 GET방식 요청해오는 경우 처리
    //호출주소: http://localhost:3000/api/article
    //호출방식: GET방식
    //호출결과: 게시글 전체 목록 데이터 반환
    if (req.method == "GET") {
      //Step1:로직구현
      const articles: IArticle[] = [
        {
          id: 1,
          title: "게시글 제목1입니다.",
          contents: "내용1입니다.",
          view_cnt: 0,
          ip_addres: "",
          created_at: Date.now().toString(),
          created_member_id: 1,
        },
        {
          id: 2,
          title: "게시글 제목2입니다.",
          contents: "내용2입니다.",
          view_cnt: 0,
          ip_addres: "",
          created_at: Date.now().toString(),
          created_member_id: 2,
        },
      ];

      //Step2:API 호출결과 설정
      apiResult.code = 200;
      apiResult.data = articles;
      apiResult.msg = "Ok";
    }

    //클라이언트에서 POST방식 요청해오는 경우 처리
    if (req.method == "POST") {
      //Step1:프론트엔드 전달 데이터 추출하기
      const title: string = req.body.title;
      const contents: string = req.body.contents;
      const created_member_id: number = req.body.member_id;

      //Step2:DB저장처리
      const article = {
        id: 1,
        title: title,
        contents: contents,
        view_cnt: 0,
        ip_addres: "111.111.111.111",
        created_at: Date.now().toString(),
        created_member_id: created_member_id,
      };

      //Step2:API 호출결과 설정
      apiResult.code = 200;
      apiResult.data = article;
      apiResult.msg = "Ok";
    }
  } catch (err) {
    //Step2:API 호출결과 설정
    apiResult.code = 500;
    apiResult.data = null;
    apiResult.msg = "Server Error Failed";
  }

  res.json(apiResult);
}
