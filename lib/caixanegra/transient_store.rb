# frozen_string_literal: true

module Caixanegra
  class TransientStore
    def get(uid)
      raise NotImplementedError, "Transient Store needs to implement 'get(uid)'"
    end

    def hold(uid, definition: {})
      raise NotImplementedError, "Transient Store needs to implement 'hold(uid, definition: {})'"
    end

    def new_uid
      raise NotImplementedError, "Transient Store needs to implement 'new_uid'"
    end
  end
end
