// 호출주소: http://localhost:3000/api/bot/simplebot
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
      const prompt = req.body.message;

      //Step2:LLM 모델 생성하기
      const llm = new ChatOpenAI({
        model: "gpt-4o",
        apiKey: process.env.OPENAI_API_KEY,
      });

      //Case1:초심플하게 llm연동하기
      //const result = await llm.invoke(prompt);

      //Case2: 메시지 객체를 이용해서 llm연동하기-PromptTemplate1
      //SystemMessage 객체는 LLM의 역할이나 질문(힌트)에 관련된 주요정보를 LLM에게 전달하는 역할제공
      //HumanMessage 객체는 사용자 보낸 질문 메시지를 저장해서 llm에 전달가능한 객체
      // const messages = [
      //   new SystemMessage("당신은 세계적으로 유명한 코메디언 입니다."),
      //   new HumanMessage(prompt),
      // ];
      // const result = await llm.invoke(messages);
      // console.log("LLM 응답결과 메시지타입 확인하기=AIMessage:", result);

      //Case3:ChatPromptTempate을 이용한 프롬프트 전달하기
      //프롬프트 템플리이란? LLM에게 전달할수 있는 다양한 질문 템플릿을 제공하여 보다 효율적인 질문형식을
      //만들어 LLM에게 제공해 좋은 답변을 만들기 위한 방식제공
      //의도: 좋은 질문이 좋은 답변을 만든다.
      // const promptTemplate = ChatPromptTemplate.fromMessages([
      //   ["system", "당신은 뛰어난 실력을 가진 쉐프입니다."],
      //   ["user", "{input}"],
      // ]);

      // //template.pipe(LLM모델) : chain객체 반환(chain은 처리할 작업의 기본단위)
      // //chain(처리할작업)을 여러개 생성하고 chain연결해 로직을 구현하는 방식이 LangChain이다..
      // const chain = promptTemplate.pipe(llm);
      // const result = await chain.invoke({ input: prompt });

      //CASE4 : LLM 응답 결과 메시지는 기본 AIMessage 객체를 반환하지만
      //해당 타입을 맞춤형 데이터 타입으로 변환해주는 OutParser를 이용해 원하는 포맷으로 변경가능하다
      const outputParser = new StringOutputParser();
      const promptTemplate = ChatPromptTemplate.fromMessages([
        ["system", "당신은 근대사 역사학자입니다."],
        ["user", "{input}"],
      ]);

      //template.pipe().pipe(): 두개의 체인을 만들과 순차적으로 두개의 체인목록을 가진 결과체인 반환..
      //llm모델에의해 결과메시지(AIMessage)를 받아 StringOutputParser를 통해 문자열로 변환한 결과제공
      const chains = promptTemplate.pipe(llm).pipe(outputParser);

      //outputParser로 인해 result값은 실제 llm의 응답메시지 문자열이 반환됨(AIMessage.content)
      const resultMessage = await chains.invoke({ input: prompt });

      const resultMsg: IMessage = {
        user_type: UserType.BOT,
        message: resultMessage,
        send_date: new Date(),
      };

      //메시지 처리결과데이터: result가 AIMessage타입인경우(CASE1~3에 해당하는 경우만)
      // const resultMsg: IMessage = {
      //   user_type: UserType.BOT,
      //   message: result.content as string,
      //   send_date: Date.now().toString(),
      // };

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
