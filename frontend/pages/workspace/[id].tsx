import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Editor from "@/components/Editors/CompletionEditor";
import ChatEditor from "@/components/Editors/ChatEditor";
import Modal from "@/components/Modals/Modal";
import VariableModal from "@/components/Modals/VariableModal";
import TabNavigation from "@/components/Editors/TabNavigation";
import RightPanel from "@/components/Editors/RightPanel";
import ErrorPage from "next/error";
import {
  shouldShowSaveModal,
  shouldShowSaveVariableModal,
} from "@/stores/ModalStore";
import { tabStore } from "@/stores/TabStore";
import { modelStore } from "@/stores/ModelStore";
import { promptStore } from "@/stores/prompts";
import Link from "next/link";
import Head from "next/head";
import Warning from "@/components/Alerts/Warning";

export default function SinglePromptEditPage() {
  const { push, query } = useRouter();

  const { show_modal, toggle_modal } = shouldShowSaveModal();

  const { show_variable_modal, toggle_variable_modal } =
    shouldShowSaveVariableModal();

  const {
    tabs,
    addTab,
    removeTabFromTabs,
    findBestNextTab,
    setActiveTab,
    isActiveTab,
    setActiveTabById,
  } = tabStore();

  const {
    activateLocalPrompt,
    updateLocalPromptValues,
    promptObject,
    prompts,
    createLocalPrompt,
    updateLocalPrompt,
  } = promptStore() ?? {};

  const {
    modelListSelector,
    fetchAllModels,
    selectedModel,
    setModelById,
    modelObject,
    models,
  } = modelStore();

  useEffect(() => {
    const id = query.id as string;
    activateLocalPrompt(id);
    setModelById(promptObject.id as string);
    setActiveTabById(id);
  }, [
    query.id,
    promptObject.id,
    setActiveTabById,
    setModelById,
    activateLocalPrompt,
  ]);

  const changeIdInUrl = (newId: string) => {
    const newUrl = `/workspace/${newId}`;
    push(newUrl);
  };

  const removePlaygroundTab = (e: any, id: string) => {
    e.stopPropagation();

    if (isActiveTab(id) && tabs.length > 1) {
      const bestNextTab = findBestNextTab();
      bestNextTab?.prompt_id && changeIdInUrl(bestNextTab.prompt_id);
    }

    var x = removeTabFromTabs(id)?.length;

    if (x === 0) {
      push("/prompts");
    }
  };

  const newPrompt = async () => {
    const newId = await createLocalPrompt();
    setActiveTabById(newId as string);
    activateLocalPrompt(newId as string);
    setModelById(newId as string);
    push(`/workspace/${newId}`);
  };

  return (
    <>
      <Head>
        <title>Edit {promptObject.name} - PromptDesk</title>
      </Head>
      {promptObject && (
        <div className="pg-main">
          <div className="pg-tab-header">
            {/* TABS */}
            <div className="hidden sm:block">
              <TabNavigation
                tabs={tabs}
                updateLocalPrompt={updateLocalPrompt}
                newPrompt={newPrompt}
                removePlaygroundTab={removePlaygroundTab}
                promptObject={promptObject}
              />
            </div>
          </div>
          {promptObject.id === "" && <ErrorPage statusCode={404} />}
          {promptObject.id && promptObject.id !== "" && (
            <div className="pg-body">
              {/*show && <History />*/}
              {show_modal && <Modal />}
              {show_variable_modal && <VariableModal />}
              <div className="pg-editor">
                <Warning
                  className="mb-2"
                  display={modelObject?.input_format != undefined}
                  text={<>This model format is deprecated. Please download and upload sample models here: <a href="https://github.com/promptdesk/promptdesk/tree/main/models" target="_blank" className="text-yellow-700 underline decoration-solid text visited:text-yellow-700">https://github.com/promptdesk/promptdesk/tree/main/models</a></>}
                />
                <div className="pg-content-body">
                  {modelObject?.type === "chat" ? <ChatEditor /> : <Editor />}
                </div>
              </div>
              {modelObject && (
                <RightPanel
                  toggle_modal={toggle_modal}
                  modelListSelector={modelListSelector}
                  selectedModel={selectedModel}
                  setModelById={setModelById}
                  modelObject={modelObject}
                  promptObject={promptObject}
                  updateLocalPromptValues={updateLocalPromptValues}
                />
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
