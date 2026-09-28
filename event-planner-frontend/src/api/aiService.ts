// Mock service for AI integration
export const aiService = {
  sendAICommand: async (command: string, updateScene: (data: any) => void) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        let response = "I didn't understand that.";
        
        if (command.toLowerCase().includes("chairs to red")) {
          response = "Sure! I'll update the chair color.";
          updateScene({ type: 'COLOR_UPDATE', target: 'chairs', value: 'red' });
        } else if (command.toLowerCase().includes("capacity to 600")) {
          response = "Updating hall capacity to 600...";
          updateScene({ type: 'LAYOUT_UPDATE', target: 'capacity', value: 600 });
        } else if (command.toLowerCase().includes("dj")) {
          response = "Adding DJ setup in the corner.";
          updateScene({ type: 'ADD_OBJECT', target: 'dj_setup' });
        } else {
          response = `Executing: ${command}`;
        }
        
        resolve(response);
      }, 1500);
    });
  }
};
