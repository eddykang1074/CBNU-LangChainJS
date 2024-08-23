// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
// 호출주소: http://localhost:3000/api/hello
// 라우팅 주소는 /api 폴더 아래 물리적 폴더명과 파일명으로 라우팅 주소가 설정됨

//NextApiRequest 타입는 웹브라우저에서 서버로 전달되는 각종 정보를 추출하는 HTTPRequest 객체=req
//NextApiResponse 타입은 서버에서 웹브라우저로 전달하는 응답처리를 위한 HttpResponse 객체=res
import type { NextApiRequest, NextApiResponse } from "next";

//서버에서 웹브라우저로 반환하는 처리결과 데이터 타입
type ResponseData = {
  code: number;
  data: string | null;
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
    if (req.method == "GET") {
      //Step1:로직구현

      //Step2:API 호출결과 설정
      apiResult.code = 200;
      apiResult.data = "안녕하세요.백엔드데이터 GET 서비스입니다.";
      apiResult.msg = "Ok";
    }

    //클라이언트에서 POST방식 요청해오는 경우 처리
    if (req.method == "POST") {
      //Step1:로직구현

      //Step2:API 호출결과 설정
      apiResult.code = 200;
      apiResult.data = "안녕하세요.백엔드데이터 POST 서비스입니다.";
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
