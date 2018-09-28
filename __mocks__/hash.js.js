const hash = jest.requireActual('hash.js');
let count = 0;

const hashMock = {
  sha256: () => {
    return {
      update: str => {
        return {
          digest: () => {
            return str;
          },
        };
      },
    };
  },
};

module.exports = hashMock;
