// 호출주소: http://localhost:3000/api/bot/translatebot
// 라우팅 주소는 /api 폴더 아래 물리적 폴더명과 파일명으로 라우팅 주소가 설정됨

//NextApiRequest 타입는 웹브라우저에서 서버로 전달되는 각종 정보를 추출하는 HTTPRequest 객체=req
//NextApiResponse 타입은 서버에서 웹브라우저로 전달하는 응답처리를 위한 HttpResponse 객체=res
import type { NextApiRequest, NextApiResponse } from "next";

//프론트엔드로 반환할 메시지 데이터 타입 참조하기
import { IMessage, UserType } from "@/interfaces/message";

//OpenAI LLM 서비스 객체 참조하기
import { ChatOpenAI } from "@langchain/openai";

//시스템,휴먼 메시지 객체를 참조합니다.
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

//프롬프트 템플릿 참조하기
import { ChatPromptTemplate } from "@langchain/core/prompts";

//LLM 응답메시지 타입을 원하는 타입결과물로 파싱(변환)해주는 아웃풋파서참조하기
//StringOutputParser는 AIMessage타입에서 content속성값만 문자열로 반환해주는 파서입니다.
import { StringOutputParser } from "@langchain/core/output_parsers";

//서버에서 웹브라우저로 반환하는 처리결과 데이터 타입
type ResponseData = {
  code: number;
  data: string | null | IMessage;
  msg: string;
};

//해당 업무(Hello)에 대한 C/R/U/D 처리를 위한 RESTFul API 기능구현 핸들러 함수
//하나의 함수로 해당업무의 모든 라우팅방식을 통합해서 기능을 제공하는 통합 라우팅 함수
export default async function handler(
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
    //클라이언트에서 POST방식 요청해오는 경우 처리
    if (req.method == "POST") {
      //Step1:프론트엔드에서 사용자 프롬프트 추출하기
      const role = req.body.role;
      const prompt = req.body.message;

      //Step2:LLM 모델 생성하기
      const llm = new ChatOpenAI({
        model: "gpt-4o",
        apiKey: process.env.OPENAI_API_KEY,
      });

      //Case1:ChatPromptTempate을 이용한 프롬프트 전달하기
      //프롬프트 템플리이란? LLM에게 전달할수 있는 다양한 질문 템플릿을 제공하여 보다 효율적인 질문형식을
      //만들어 LLM에게 제공해 좋은 답변을 만들기 위한 방식제공
      //의도: 좋은 질문이 좋은 답변을 만든다.
      // const promptTemplate = ChatPromptTemplate.fromMessages([
      //   ["system", role],
      //   ["user", "{input}"],
      // ]);

      // //template.pipe(LLM모델) : chain객체 반환(chain은 처리할 작업의 기본단위)
      // //chain(처리할작업)을 여러개 생성하고 chain연결해 로직을 구현하는 방식이 LangChain이다..
      // const chain = promptTemplate.pipe(llm);
      // const result = await chain.invoke({ input: prompt });

      //Case2: System,Human Message를 이용한 llm호출을 구현해주세요.
      const messages = [new SystemMessage(role), new HumanMessage(prompt)];
      //const result = await llm.invoke(messages);

      const parser = new StringOutputParser();
      const chain = llm.pipe(parser);
      const resultMessage = await chain.invoke(messages);

      //메시지 처리결과데이터: result가 AIMessage타입인경우(CASE1~3에 해당하는 경우만)
      const resultMsg: IMessage = {
        user_type: UserType.BOT,
        message: resultMessage,
        send_date: new Date(),
      };

      //Step2:API 호출결과 설정
      apiResult.code = 200;
      apiResult.data = resultMsg;
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
