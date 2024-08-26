// 호출주소: http://localhost:3000/api/pdfpineconebot
// PDF파일 PineCone Cloud Vectore DB 기반 RAG 챗봇 구현하기
// PDF 파일내 텍스트 추출을 위한 npm i pdf-parse 설치 필요
// npm install @langchain/pinecone
// npm install @pinecone-database/pinecone

import type { NextApiRequest, NextApiResponse } from "next";

//프론트엔드로 반환할 메시지 데이터 타입 참조하기
import { IMemberMessage, UserType } from "@/interfaces/message";

//OpenAI LLM 서비스 객체 참조하기
import { ChatOpenAI } from "@langchain/openai";

//PDF 파일 로더 참조하기 : 서버(프로젝트)내물리적 파일존재시 사용
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

//Web사이트상에 존재하는 pdf파일 로드 참조하기 :예시/참고용
// import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
// const blob = new Blob();
// const loader = new WebPDFLoader(blob);

//텍스트 스플릿터 객체 참조하기
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

//임베딩처리를 위한 OpeanAI Embedding 객체 참조하기
//임베딩이란 문장내 단어를 벡터 수치화하는 과정
import { OpenAIEmbeddings } from "@langchain/openai";

//PineCone 클라우드 벡터 DB 연결 객체 참조하기
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";

//시스템,휴먼 메시지 객체를 참조합니다.
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

//프롬프트 템플릿 참조하기
import { ChatPromptTemplate } from "@langchain/core/prompts";

//LLM 응답메시지 타입을 원하는 타입결과물로 파싱(변환)해주는 아웃풋파서참조하기
//StringOutputParser는 AIMessage타입에서 content속성값만 문자열로 반환해주는 파서입니다.
import { StringOutputParser } from "@langchain/core/output_parsers";

//Rag체인,LLM 생성을 위한 모듈 참조
//LangChian Hub는 일종의 오픈소스 저장소처럼 langchain에 특화된 공유된 각종 (RAG전용)프롬프트템플맂 제공
//각종 RAG전용 프롬프트 템플릿들이 제공되며 HUB와 통신하기 위해 pull객체를 참조합니다.
import { pull } from "langchain/hub";

//LLM모델에 RAG기반 체인생성 클래스 참조하기
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";

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

      //Step2:LLM 모델 생성하기
      const llm = new ChatOpenAI({
        model: "gpt-4o",
        temperature: 0.2,
        apiKey: process.env.OPENAI_API_KEY,
      });

      //Step3: PDF파일 Indexing 과정
      //Step3-1: Indexing과정의 document load 과정
      const loader = new PDFLoader("example_data/Manual.pdf", {
        parsedItemSeparator: "",
      });

      //PDF파일내 페이지 하나당 문서하나가 생성됨(docs내 doc=pdf page1개)
      const docs = await loader.load();

      //Step3-2: 문서내 문장을 Splitting(Chunk화처리) 처리하기
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      //pdf document를 지정한 splitter로 단어단위 쪼갠(ChunkData) 집함을 생성
      const splitDocs = await splitter.splitDocuments(docs);

      //Step3-3: Embeding/Embeding 수치데이터 저장 과정: Splitting된 문서내 단어들을 임베딩(벡터화처리)처리해서 Pincone 벡터저장소에 저장하기
      //지정한 임베딩모델을 통해 chunk data를 개별 vetor 수치화하고 수치화된 데이터를
      //지정한 Cloud Pinecone Vector Index 전용 저장소에 저장한다.
      //사용할 임베딩 모델 객체 생성하기
      const embedding = new OpenAIEmbeddings({
        model: "text-embedding-3-small",
      });

      //파인콘 벡터 테이블(인덱스) 지정하기
      const pinecone = new PineconeClient();
      const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!);

      //청크 데이터를 파인콘 지정 Index에 벡터 수치화해서 저장처리함
      const vectorStore = await PineconeStore.fromDocuments(
        splitDocs,
        embedding,
        {
          pineconeIndex: pineconeIndex,
        }
      );

      //Step4: Query를 통해 벡터저장소에서 사용자 질문과 관련된 검색결과 조회하기
      // 메모리 벡터 저장소에서 사용자 질문으로 Query하기
      //vector저장소 기반 검색기 변수 정의
      //검색기 객체를 생성하기
      const retriever = vectorStore.asRetriever();
      const searchResult = await retriever.invoke(message);
      console.log("벡터저장소 쿼리 검색결과:", searchResult);

      //Step5: RAG 전용 Promt와  chain 생성하기
      //createStuffDocumentsChain()는 LLM모델에 RAG기반 검색 결과를 전달가능한 프롬프트 사용 체인 생성
      //RAG 조회결과를 포함한 전용 프롬프트 체인생성

      //langchain/hub를 통해 공유된 rag전용 프롬프트 템플릿 참조생성하기
      const ragPrompt = await pull<ChatPromptTemplate>("rlm/rag-prompt");

      const ragChain = await createStuffDocumentsChain({
        llm: llm,
        prompt: ragPrompt,
        outputParser: new StringOutputParser(),
      });

      //Step6: RAG기반 LLM 질문하기
      //LLM Chain을 실행하고 실행시 벡터저장소 검색결과를 추가로 전달해서 llm을 실행한다.
      const resultMessage = await ragChain.invoke({
        question: message, //사용자 질문
        context: searchResult, // 사용자 질문결과 벡터저장소 RAG검색결과 값
      });

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
