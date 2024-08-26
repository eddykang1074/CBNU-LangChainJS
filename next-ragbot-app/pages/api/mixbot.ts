// 호출주소: http://localhost:3000/api/mixbot
// Google LLM Gemini 챗봇 구현하기
// npm install @langchain/google-genai

import type { NextApiRequest, NextApiResponse } from "next";

//프론트엔드로 반환할 메시지 데이터 타입 참조하기
import { BotType, IMemberMessage, UserType } from "@/interfaces/message";

//OPENAI ChatGPT LLM 참조하기
import { ChatOpenAI } from "@langchain/openai";

//Google Gemini LLM 객체 참조하기
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

//Gemini 기반 RAG구현시 사용할수 있는 구글 임베딩 모델참고
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

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
  data: string | null | IMemberMessage;
  msg: string;
};

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
      const message = req.body.message; //사용자 입력 메시지 추출
      const nickName = req.body.nickName; //사용자 대화명 추출
      const botType = req.body.botType as BotType;

      let resultMessage = "";
      if (botType == BotType.LLMGPT) {
        const llm = new ChatOpenAI({
          model: "gpt-4o",
          apiKey: process.env.OPENAI_API_KEY,
        });
        const response = await llm.invoke(message);
        resultMessage = response.content as string;
      }

      //Step2:LLM 모델 생성하기
      if (botType == BotType.LLMGEMINI) {
        const llm = new ChatGoogleGenerativeAI({
          modelName: "gemini-pro",
          maxOutputTokens: 2048,
        });

        const response = await llm.invoke(message);
        resultMessage = response.content as string;
      }

      //Case1: Simple Gemini 챗봇 실행하기

      //Case2: 프롬프트 템플릿과 OutputPaser적용하기
      //   const outputParser = new StringOutputParser();
      //   const prompt = ChatPromptTemplate.fromMessages([
      //     ["system", "당신은 세계적으로 유명한 여행작가입니다."],
      //     ["user", "{input}"],
      //   ]);

      //   const chain = prompt.pipe(geminiLLM).pipe(outputParser);
      //   const resultMessage = await chain.invoke({ input: message });

      //프론트엔드로 반환되는 메시지 데이터 생성하기
      const resultMsg: IMemberMessage = {
        user_type: UserType.BOT,
        nick_name: "bot",
        message: resultMessage,
        send_date: new Date(),
      };

      apiResult.code = 200;
      apiResult.data = resultMsg;
      apiResult.msg = "Ok";
    }
  } catch (err) {
    const resultMsg: IMemberMessage = {
      user_type: UserType.BOT,
      nick_name: "bot",
      message: "조회결과가 존재하지 않거나 조회에 실패했습니다.",
      send_date: new Date(),
    };

    //Step2:API 호출결과 설정
    apiResult.code = 500;
    apiResult.data = resultMsg;
    apiResult.msg = "Server Error Failed";
  }

  res.json(apiResult);
}
